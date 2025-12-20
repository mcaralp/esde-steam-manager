
import fs from 'fs/promises'
import path from 'path'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import { isXmlArray, isXmlObject } from './xml-utils'
import { ESGameInfos } from '../shared/types'

const gamelistPath = path.join('ES-DE', 'gamelists', 'steam', 'gameList.xml')

function createDefaultGameInfos(gamePath: string): ESGameInfos
{
    return {
        path: gamePath,
        name: '',
        desc: '',
        rating: 0,
        releasedate: '',
        developer: '',
        publisher: '',
        genre: '',
        players: ''
    }
}

function parseGameFromXml(game: any): ESGameInfos
{
    return {
        path: game.path ?? '',
        name: game.name ?? '',
        desc: game.desc ?? '',
        rating: isNaN(parseFloat(game.rating)) ? 0 : parseFloat(game.rating),
        releasedate: game.releasedate ?? '',
        developer: game.developer ?? '',
        publisher: game.publisher ?? '',
        genre: game.genre ?? '',
        players: game.players ?? ''
    }
}

async function getGameInfosXml(folder: string): Promise<any>
{
    try
    {
        const parser = new XMLParser()
        const file = path.join(folder, gamelistPath)
        const list = await fs.readFile(file, 'utf-8')
        return parser.parse(list)
    }
    catch
    {
        return []
    }
}

export async function getGameInfos(folder: string): Promise<Array<ESGameInfos>>
{
    try
    {
        const xml = await getGameInfosXml(folder)
        if(isXmlObject(xml?.gameList?.game))
        {
            return [parseGameFromXml(xml.gameList.game)]
        }

        if(!isXmlArray(xml?.gameList?.game))
        {
            return []
        }
        return xml.gameList.game.map(parseGameFromXml)
    }
    catch (error)
    {
        console.error('Error reading gameList.xml:', error)
        return []
    }
}

export async function setGameInfos(folder: string, game: ESGameInfos): Promise<void>
{
    let xml = await getGameInfosXml(folder)

    if(!isXmlObject(xml))
    {
        xml = {}
    }

    if(!isXmlObject(xml.gameList))
    {
        xml.gameList = {}
    }

    if(!isXmlArray(xml.gameList.game))
    {
        if(isXmlObject(xml.gameList.game))
        {
            xml.gameList.game = [xml.gameList.game]
        }
        else
        {
            xml.gameList.game = []
        }
    }
    
    const i = xml.gameList.game.findIndex((g: any) => g.path === game.path)
    if(i !== -1)
    {
        Object.assign(xml.gameList.game[i], game)
    }
    else
    {
        xml.gameList.game.push(game)
    }

    const builder = new XMLBuilder({ format: true, indentBy: "  " })
    const xmlContent = builder.build(xml)
    const file = path.join(folder, gamelistPath)
    await fs.writeFile(file, xmlContent, 'utf-8')
}

export function getInfosOfGame(infosList: Array<ESGameInfos>, gamePath: string): ESGameInfos
{
    const found = infosList.find((g) => g.path === gamePath)
    return found ?? createDefaultGameInfos(gamePath)
}
