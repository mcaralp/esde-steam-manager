
import fsPromises from 'fs/promises'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import { isXmlArray, isXmlObject } from './xml-utils'
import { ESGameSteamMetadata } from '../shared/types'

const steamidsPath = path.join('ES-DE', 'gamelists', 'steam', 'steamids.xml')
const assetFolder = path.join('ES-DE', 'downloaded_media', 'steam')

type AssetType = 'marquees' | 'screenshots' | 'videos' | 'covers' | 'miximages'

async function updateAsset(folder: string, type: AssetType, assetUrl: string, gamePath: string): Promise<void>
{
    const assetDir = path.join(folder, assetFolder, type)
    const fileName = path.parse(gamePath).name
    const url = new URL(assetUrl)
    const ext = path.extname(url.pathname)
    const fullFilePath = path.join(assetDir, `${fileName}${ext}`)

    console.log(`Downloading asset from ${assetUrl} to ${fullFilePath}`)

    await fsPromises.mkdir(assetDir, { recursive: true })
    const response = await axios.get(assetUrl, { responseType: 'stream'})
    const stream = fs.createWriteStream(fullFilePath)
    response.data.pipe(stream)
    await new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(undefined))
        stream.on('error', reject)
    })

    console.log(`Asset downloaded: ${fullFilePath}`)
}

function createDefaultSteamMetadata(gamePath: string): ESGameSteamMetadata
{
    return {
        path: gamePath,
        steamid: 0,
        marquee: '',
        screenshot: '',
        video: '',
        cover: '',
        miximage: ''
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
        cover: game.cover ?? '',
        miximage: game.miximage ?? ''
    }
}

async function getSteamMetadataXml(folder: string): Promise<any>
{
    try
    {
        const parser = new XMLParser()
        const file = path.join(folder, steamidsPath)
        const list = await fsPromises.readFile(file, 'utf-8')
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

export async function setSteamMetadata(folder: string, meta: ESGameSteamMetadata): Promise<void>
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
        if(isXmlObject(xml.gameList.game))
        {
            xml.gameList.game = [xml.gameList.game]
        }
        else
        {
            xml.gameList.game = []
        }
    }
    
    const i = xml.gameList.game.findIndex((g: any) => g.path === meta.path)
    if(i !== -1)
    {
        const old = xml.gameList.game[i]
        if(meta.cover !==  old.cover) await updateAsset(folder, 'covers', meta.cover, meta.path)
        if(meta.marquee !==  old.marquee) await updateAsset(folder, 'marquees', meta.marquee, meta.path)
        if(meta.miximage !==  old.miximage) await updateAsset(folder, 'miximages', meta.miximage, meta.path)
        if(meta.screenshot !==  old.screenshot) await updateAsset(folder, 'screenshots', meta.screenshot, meta.path)
        if(meta.video !==  old.video) await updateAsset(folder, 'videos', meta.video, meta.path)
        Object.assign(xml.gameList.game[i], meta)
    }
    else
    {
        await updateAsset(folder, 'covers', meta.cover, meta.path)
        await updateAsset(folder, 'marquees', meta.marquee, meta.path)
        await updateAsset(folder, 'screenshots', meta.screenshot, meta.path)
        await updateAsset(folder, 'videos', meta.video, meta.path)
        await updateAsset(folder, 'miximages', meta.miximage, meta.path)
        xml.gameList.game.push(meta)
    }

    const builder = new XMLBuilder({ format: true, indentBy: "  " })
    const xmlContent = builder.build(xml)
    const file = path.join(folder, steamidsPath)
    await fsPromises.writeFile(file, xmlContent, 'utf-8')
}

export function getSteamMetadataOfGame(metadata: Array<ESGameSteamMetadata>, gamePath: string): ESGameSteamMetadata
{
    const found = metadata.find((g) => g.path === gamePath)
    return found ?? createDefaultSteamMetadata(gamePath)
}
