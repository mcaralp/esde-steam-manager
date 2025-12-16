export interface GameSearchResult
{
    appId: number
    name: string
}

export interface UserInfo
{
    steamId: string
    accountName: string
}

export type QrEvent = { type: 'qr-started'; qrCode: string } | { type: 'qr-scanned' }

export type QrEventCallback = (event: QrEvent) => void

export interface ESGameSteamMetadata
{
    path: string
    steamid: number
    marquee: string
    screenshot: string
    video: string
    cover: string
}

export interface ESGameInfos
{
    path: string
    name: string
    desc: string
    rating: number
    releasedate: string
    developer: string
    publisher: string
    genre: string
    players: number
}

export interface ESGame
{
    infos: ESGameInfos
    metadata: ESGameSteamMetadata
}

export interface ESFoldersConfig
{
    folders: string[]
}
