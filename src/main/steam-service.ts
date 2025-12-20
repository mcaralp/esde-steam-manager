import Conf from 'conf'
import SteamUser from 'steam-user'
import axios from 'axios'
import { LoginSession, EAuthTokenPlatformType } from 'steam-session'
import { GameSearchResult, UserInfo, QrEventCallback } from '../shared/types'
import fs from 'fs'

interface SteamConfig
{
    refreshToken: string | null
}

type SearchCache = Record<string, Array<GameSearchResult>>
type GameInfosCache = Record<number, any>

export default class SteamService
{
    private steamUser: SteamUser | null
    private refreshToken: string | null
    private store: Conf<SteamConfig>
    private searchCache : SearchCache
    private gameInfosCache : GameInfosCache

    public constructor()
    {
        this.store = new Conf<SteamConfig>({
            defaults: {
                refreshToken: null
            }
        })
        this.refreshToken = this.store.get('refreshToken')
        this.steamUser = null
        this.searchCache = {}
        this.gameInfosCache = {}
    }

    public connect(): Promise<void>
    {
        return new Promise((resolve, reject) =>
        {
            if(this.steamUser)
            {
                resolve()
                return
            }
            if(this.refreshToken === null)
            {
                reject(new Error('No refresh token available'))
                return
            }
            this.steamUser = new SteamUser()
            
            this.steamUser.logOn({
                refreshToken: this.refreshToken
            })

            this.steamUser.on('loggedOn', () => {
                resolve()
            })

            this.steamUser.on('error', (err) => {
                this.disconnect()
                reject(err)
            })
        })
    }

    public disconnect(): void
    {
        if (this.steamUser)
        {
            this.steamUser.logOff()
            this.steamUser = null
        }
        this.refreshToken = null
        this.store.set('refreshToken', null)
    }

    getUserInfo(): UserInfo
    {
        if (this.steamUser)
        {
            return {
                steamId: this.steamUser.steamID.getSteamID64(),
                accountName: this.steamUser.accountInfo.name
            }
        }
        throw new Error('Not connected to Steam')
    }

    startQrLogin(cb: QrEventCallback): Promise<void>
    {
        return new Promise(async (resolve, reject) => {
            try
            {
                if(this.refreshToken)
                {
                    throw new Error('Already have a refresh token. Please disconnect first.')
                }

                const session = new LoginSession(EAuthTokenPlatformType.SteamClient)
                session.loginTimeout = 120000 // timeout after 2 minutes

                const startResult = await session.startWithQR()
                cb({ type:'qr-started', qrCode: startResult.qrChallengeUrl ?? '' })

                session.on('remoteInteraction', () =>
                {
                    cb({ type:'qr-scanned' })
                })

                session.on('authenticated', async () =>
                {
                    this.refreshToken = session.refreshToken
                    this.store.set('refreshToken', this.refreshToken)

                    try
                    {
                        await this.connect()
                        resolve()
                    }
                    catch (error)
                    {
                        reject(error)
                    }
                })

                session.on('timeout', () =>
                {
                    reject(new Error('QR login timed out'))
                })

                session.on('error', () =>
                {
                    reject(new Error('QR login error occurred'))
                })
            }
            catch (error)
            {
                reject(error)
            }
        })
    }

    async searchGames(name: string): Promise<Array<GameSearchResult>>
    {
        if(this.searchCache[name])
        {
            return this.searchCache[name]
        }
        const url = 'https://store.steampowered.com/api/storesearch/'
        const res = await axios.get(url, {
            params: {
                term: name,
                l: 'en',
                cc: 'us'
            }
        })

        const results: Array<GameSearchResult> = []
        for(const item of res.data.items)
        {
            results.push({
                appId: item.id,
                name: item.name
            })
        }
        this.searchCache[name] = results
        return results
    }

    async getGameInfo(appId: number): Promise<any>
    {
        if (this.steamUser === null)
        {
            throw new Error('Not connected to Steam')
        }
        if(this.gameInfosCache[appId])
        {
            return this.gameInfosCache[appId]
        }

        const productInfo = await this.steamUser.getProductInfo([appId], [])
        const appDetails = await axios.get('https://store.steampowered.com/api/appdetails', {
            params: {
                appids: appId,
                l: 'en',
                cc: 'us'
            }
        })

        const appReviews = await axios.get(`https://store.steampowered.com/appreviews/${appId}`, {
            params: {
                json: 1,
                count: 1,
                l: 'en'
            }
        })
        
        const combinedInfo = {
            ...productInfo.apps[appId].appinfo,
            ...appDetails.data[appId].data,
            reviews_summary: appReviews.data.query_summary,
            review: appReviews.data.reviews
        }

        const file = 'steam_app_' + appId + '.json'
        fs.writeFileSync(file, JSON.stringify(combinedInfo, null, 4))

        this.gameInfosCache[appId] = combinedInfo
        return combinedInfo
    }
}

