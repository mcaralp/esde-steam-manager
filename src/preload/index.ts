import { contextBridge, ipcRenderer } from 'electron'
import { GameSearchResult, UserInfo, QrEventCallback, ESGame } from '../shared/types'

const api =
{
    getUserInfo (): Promise<UserInfo>
    {
        return ipcRenderer.invoke('steam:get-user-info')
    },

    startQrLogin(cb: QrEventCallback): Promise<void>
    {
        const listener = (_event: any, data: any) => cb(data)
        ipcRenderer.on('steam:qr-event', listener)
        return ipcRenderer.invoke('steam:start-qr-login')
    },

    disconnect (): Promise<void>
    {
        return ipcRenderer.invoke('steam:disconnect')
    },

    searchGames (gameName: string): Promise<Array<GameSearchResult>>
    { 
        return ipcRenderer.invoke('steam:search-games', gameName)
    },

    getGameInfo (appId: number): Promise<any>
    {
        return ipcRenderer.invoke('steam:get-game-info', appId)
    },

    getESGames(folderPath: string): Promise<Array<ESGame>>
    {
        return ipcRenderer.invoke('es:get-games', folderPath)
    },

    addESFolder (): Promise<string>
    {
        return ipcRenderer.invoke('es:add-folder')
    },

    getESFolders (): Promise<Array<string>>
    {
        return ipcRenderer.invoke('es:get-folders')
    }
}

contextBridge.exposeInMainWorld('api', api)
