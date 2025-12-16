import Conf from 'conf'
import { dialog } from 'electron'
import type { ESFoldersConfig } from '../shared/types'

export default class ESFolders
{
    private store: Conf<ESFoldersConfig>

    public constructor()
    {
        this.store = new Conf<ESFoldersConfig>({
            defaults: {
                folders: []
            },
            schema: {
                folders: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                    default: []
                }
            }
        })
    }

    public getFolders(): string[]
    {
        return this.store.get('folders')
    }

    public async addFolder(): Promise<string>
    {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory'],
            title: 'Select ES-DE folder',
            buttonLabel: 'Select Folder'
        })

        if (result.canceled || result.filePaths.length === 0)
        {
            throw new Error('No folder selected')
        }

        const folderPath = result.filePaths[0]
        const folders = this.store.get('folders')

        if (!folders.includes(folderPath))
        {
            folders.push(folderPath)
            this.store.set('folders', folders)
        }

        return folderPath
    }
}
