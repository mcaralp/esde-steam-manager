export interface SteamAPI
{
    getUserInfo: () => Promise<UserInfo>
    startQrLogin: (cb: QrEventCallback) => Promise<void>
    disconnect: () => Promise<void>
    searchGames: (gameName: string) => Promise<Array<GameSearchResult>>
    getGameInfo: (appId: number) => Promise<any>
    getESGames: (folderPath: string) => Promise<Array<ESGame>>
    addESFolder: () => Promise<string>
    getESFolders: () => Promise<Array<string>>
}

declare global
{
    interface Window
    {
        api: SteamAPI
    }
}
