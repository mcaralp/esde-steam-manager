
import fs from 'fs/promises'
import path from 'path'
import { getGameInfos, getInfosOfGame, setGameInfos } from './es-game-infos'
import { getSteamMetadata, getSteamMetadataOfGame, setSteamMetadata } from './es-steam-metadata'
import { ESGame } from '../shared/types'

export async function getESGames(folder: string): Promise<Array<ESGame>>
{
    const ext = [
        '.bat', '.BAT', '.lnk', '.LNK', '.url', '.URL'
    ]

    const games : Array<ESGame> = []
    const romsPath = path.join(folder, 'ROMs', 'steam')
    const gameFiles = await fs.readdir(romsPath)
    const gameFileOk = gameFiles.filter((game) => ext.includes(path.extname(game)))
    const gameList = await getGameInfos(folder)
    const steamMetadata =  await getSteamMetadata(folder)

    for(const gameFile of gameFileOk)
    {
        const gamePath = `./${gameFile}`
        const infos = getInfosOfGame(gameList, gamePath)
        const metadata = getSteamMetadataOfGame(steamMetadata, gamePath)
        games.push({infos, metadata})
    }
    return games
}


export async function setESGames(folder: string, games: Array<ESGame>): Promise<void>
{
    await setGameInfos(folder, games.map((g) => g.infos))
    await setSteamMetadata(folder, games.map((g) => g.metadata))
}
