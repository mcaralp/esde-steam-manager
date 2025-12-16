
import fs from 'fs/promises'
import path from 'path'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import { isXmlArray, isXmlObject } from './xml-utils'
import { ESGameSteamMetadata } from '../shared/types'

const steamidsPath = path.join('ES-DE', 'gamelists', 'steam', 'steamids.xml')

function createDefaultSteamMetadata(gamePath: string): ESGameSteamMetadata
{
    return {
        path: gamePath,
        steamid: 0,
        marquee: '',
        screenshot: '',
        video: '',
        cover: ''
    }
}

function parseSteamMetadataFromXml(game: any): ESGameSteamMetadata
{
    return {
        path: game.path ?? '',
        steamid: isNaN(parseInt(game.steamid)) ? 0 : parseInt(game.steamid),
        marquee: game.marquee ?? '',
        screenshot: game.screenshot ?? '',
        video: game.video ?? '',
        cover: game.cover ?? ''
    }
}

async function getSteamMetadataXml(folder: string): Promise<any>
{
    try
    {
        const parser = new XMLParser()
        const file = path.join(folder, steamidsPath)
        const list = await fs.readFile(file, 'utf-8')
        return parser.parse(list)
    }
    catch
    {
        return {}
    }
}

export async function getSteamMetadata(folder: string): Promise<Array<ESGameSteamMetadata>>
{
    try
    {
        const xml = await getSteamMetadataXml(folder)

        if(isXmlObject(xml?.gameList?.game))
        {
            return [parseSteamMetadataFromXml(xml.gameList.game)]
        }

        if(!isXmlArray(xml?.gameList?.game))
        {
            return []
        }
        return xml.gameList.game.map(parseSteamMetadataFromXml)
    }
    catch (error)
    {
        console.error('Error reading gameList.xml:', error)
        return []
    }
}

export async function setSteamMetadata(folder: string, metadata: Array<ESGameSteamMetadata>): Promise<void>
{
    let xml = await getSteamMetadataXml(folder)

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
        xml.gameList.game = []
    }
    
    for(const meta of metadata)
    {
        const i = xml.gameList.game.findIndex((g: any) => g.path === meta.path)
        if(i !== -1)
        {
            Object.assign(xml.gameList.game[i], meta)
        }
        else
        {
            xml.gameList.game.push(meta)
        }
    }

    const builder = new XMLBuilder()
    const xmlContent = builder.build(xml)
    const file = path.join(folder, steamidsPath)
    await fs.writeFile(file, xmlContent, 'utf-8')
}

export function getSteamMetadataOfGame(metadata: Array<ESGameSteamMetadata>, gamePath: string): ESGameSteamMetadata
{
    const found = metadata.find((g) => g.path === gamePath)
    return found ?? createDefaultSteamMetadata(gamePath)
}
