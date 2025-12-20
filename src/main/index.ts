import electron from 'electron'
import path from 'path'
import icon from '../../resources/icon.png?asset'
import SteamService from './steam-service'
import ESFolders from './es-folders'
import { Mutex } from 'async-mutex'
import { getESGames, setESGame } from './es-games'

function createWindow(): electron.BrowserWindow
{

    const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize
    const mainWindow = new electron.BrowserWindow(
    {
        width: width,
        height: height,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences:
        {
            preload: path.join(__dirname, '../preload/index.js')
        }
    })

    mainWindow.webContents.openDevTools()

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (!electron.app.isPackaged && process.env['ELECTRON_RENDERER_URL'])
    {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    }
    else
    {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
    }

    return mainWindow
}

function setupIPCHandlers(window: electron.BrowserWindow, steamService: SteamService, esFolders: ESFolders)
{
    const mutex = new Mutex()

    electron.ipcMain.handle('steam:get-user-info', () =>
    {
        return mutex.runExclusive(async () => {
            try
            {
                return steamService.getUserInfo()
            
            }
            catch (error: any)
            {
                console.error('Error checking auth:', error)
                throw new Error(error.message)
            }
        })
    })

    electron.ipcMain.handle('steam:start-qr-login', () =>
    {
        return mutex.runExclusive(async () => {
            try
            {
                return await steamService.startQrLogin((event) => {
                    window.webContents.send('steam:qr-event', event)
                })
            }
            catch (error: any)
            {
                console.error('Error during QR login:', error)
                throw new Error(error.message)
            }
        })
    })

    electron.ipcMain.handle('steam:disconnect', () =>
    {
        return mutex.runExclusive(() => {
            try
            {
                return steamService.disconnect()
            }
            catch (error: any)
            {
                console.error('Error disconnecting:', error)
                throw new Error(error.message)
            }
        })
    })

    electron.ipcMain.handle('steam:search-games', (_event, gameName: string) =>
    {
        return mutex.runExclusive(async () => {
            try
            {
                return steamService.searchGames(gameName)
            }
            catch (error: any)
            {
                console.error('Error searching games:', error)
                throw new Error(error.message)
            }
        })
    })

    electron.ipcMain.handle('steam:get-game-info', (_event, appId: number) =>
    {
        return mutex.runExclusive(async () => {
            try
            {
                return steamService.getGameInfo(appId)
            }
            catch (error: any)
            {
                console.error('Error getting game info:', error)
                throw new Error(error.message)
            }
        })
    })

    electron.ipcMain.handle('es:set-game', (_event, folderPath: string, game: any) =>
    {
        return mutex.runExclusive(async () => {
            try
            {
                return await setESGame(folderPath, game)
            }
            catch (error: any)
            {
                console.error('Error setting ES infos:', error)
                throw new Error(error.message)
            }
        })
    })

    
    electron.ipcMain.handle('es:get-games', (_event, folderPath: string) =>
    {
        return mutex.runExclusive(async () => {
            try
            {
                return await getESGames(folderPath)
            }
            catch (error: any)
            {
                console.error('Error getting ES infos:', error)
                throw new Error(error.message)
            }
        })
    })

    electron.ipcMain.handle('es:get-folders', () =>
    {
        return mutex.runExclusive(() => {
            try
            {
                return esFolders.getFolders()
            }
            catch (error: any)
            {
                console.error('Error getting folders:', error)
                throw new Error(error.message)
            }
        })
    })

    electron.ipcMain.handle('es:add-folder', () =>
    {
        return mutex.runExclusive(async () => {
            try
            {
                return await esFolders.addFolder()
            }
            catch (error: any)
            {
                console.error('Error adding folder:', error)
                throw new Error(error.message)
            }
        })
    })
}

async function main()
{
    await electron.app.whenReady()

    const steamService = new SteamService()
    const esFolders = new ESFolders()
    
    try
    {
        await steamService.connect()
    }
    catch (error)
    {
        console.error('Error connecting to Steam on startup:', error)
    }

    const mainWindow = createWindow()
    setupIPCHandlers(mainWindow, steamService, esFolders)

    electron.app.on('window-all-closed', () =>
    {
        electron.app.quit()
    })
}

main()
