<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import WindowFrame from './WindowFrame.vue'
import GameSelector from './GameSelector.vue'
import AssetViewer from './AssetViewer.vue'
import { HomeIcon, SaveIcon } from 'lucide-vue-next'
import type { GameSearchResult, ESGame } from '../../../shared/types'
import SpinnerLoading from './SpinnerLoading.vue'
import dayjs from 'dayjs'

const props = defineProps<{ folder: string }>()
const emit = defineEmits<{goBack: []}>()

const games = ref<ESGame[]>([])
const loading = ref(true)
const syncingPaths = ref<Set<string>>(new Set())

const currentGameIndex = ref(0)
const suggestions = ref<GameSearchResult[]>([])
const marquees = ref<string[]>([])
const screenshots = ref<string[]>([])
const miximages = ref<string[]>([])
const videos = ref<string[]>([])
const covers = ref<string[]>([])

const currentGame = computed(() =>
{
    return games.value[currentGameIndex.value]
})

const gameNames = computed(() =>
{
    return games.value.map(computeName)
})

const isSyncing = computed(() =>
{
    if (!currentGame.value) return false
    return syncingPaths.value.has(currentGame.value.infos.path)
})

function computeName(game: ESGame): string
{
    if (game.infos.name !== '')
    {
        return game.infos.name
    }
    const regex = /^\.\/(.*?)(\..+)?$/i
    return game.infos.path.replace(regex, '$1')
}

// Load suggestions based on game path
async function loadData()
{
    loading.value = true
    try 
    {    
        games.value = await window.api.getESGames(props.folder)
        await new Promise(resolve => setTimeout(resolve, 200)) // Allow UI to update
        if (currentGame.value.metadata.steamid !== 0)
        {
            await loadGameAssets(currentGame.value.metadata.steamid)
        }
        else
        {
            suggestions.value = await window.api.searchGames(computeName(currentGame.value))
        }
    }
    catch (err)
    {
        await new Promise(resolve => setTimeout(resolve, 200)) // Allow UI to update
        games.value = []
    }
    loading.value = false
}

async function selectSteamId(result: GameSearchResult)
{
    loading.value = true
    await new Promise(resolve => setTimeout(resolve, 200)) // Allow UI to update
    await loadGameAssets(result.appId)
    loading.value = false
}

async function loadGameAssets(appId: number)
{
    const gameInfo = await window.api.getGameInfo(appId)
    
    currentGame.value.infos.desc = gameInfo.short_description
    currentGame.value.infos.name = gameInfo.common.name
    currentGame.value.infos.developer = gameInfo.developers?.join(', ')
    currentGame.value.infos.publisher = gameInfo.publishers?.join(', ')
    currentGame.value.infos.releasedate = dayjs(gameInfo.common.steam_release_date * 1000).format('YYYYMMDDTHHmmss')
    currentGame.value.infos.genre = gameInfo.genres?.map((g: any) => g.description).join(', ')
    currentGame.value.infos.rating = Math.round(gameInfo.reviews_summary?.review_score) / 10
    currentGame.value.infos.players = gameInfo.categories?.some((c: any) => c.id === 1) ? '1-4' : '1'

    const assets = gameInfo.common.library_assets_full
    const base = 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/'

    covers.value = Object.values(assets.library_capsule.image).map(c => base + appId + '/' + c)
    marquees.value = Object.values(assets.library_logo.image).map(m => base + appId + '/' + m)
    miximages.value = Object.values(assets.library_header.image).map(m => base + appId + '/' + m)
    screenshots.value = gameInfo.screenshots?.map((s: any) => s.path_full)
    videos.value = gameInfo.movies?.map((m: any) => `https://video.fastly.steamstatic.com/store_trailers/${m.id}/movie480.mp4`)

    currentGame.value.metadata.steamid = appId
    if(covers.value.indexOf(currentGame.value.metadata.cover) === -1) currentGame.value.metadata.cover = covers.value[0]
    if(marquees.value.indexOf(currentGame.value.metadata.marquee) === -1) currentGame.value.metadata.marquee = marquees.value[0]
    if(miximages.value.indexOf(currentGame.value.metadata.miximage) === -1) currentGame.value.metadata.miximage = miximages.value[0]
    if(screenshots.value.indexOf(currentGame.value.metadata.screenshot) === -1) currentGame.value.metadata.screenshot = screenshots.value[0]
    if(videos.value.indexOf(currentGame.value.metadata.video) === -1) currentGame.value.metadata.video = videos.value[0]
}

async function synchronize()
{
    const gamePath = currentGame.value.infos.path
    syncingPaths.value.add(gamePath)
    
    try
    {
        await new Promise(resolve => setTimeout(resolve, 200)) // Allow UI to update
        await window.api.setESGame(props.folder, JSON.parse(JSON.stringify(currentGame.value)))
    }
    finally
    {
        syncingPaths.value.delete(gamePath)
    }
}

function goBack()
{
    emit('goBack')
}

onMounted(async () =>
{
    await loadData()
})

</script>

<template>
    <WindowFrame v-if="loading" title="Configure Games" :centered="true">
        <template #header-action>
            <button @click="goBack" class="back-btn" title="Home">
                <HomeIcon :size="18" :stroke-width="2" />
            </button>
        </template>
        <template #header-section>
            <GameSelector :game-names="gameNames" v-model="currentGameIndex" @change="loadData" />
        </template>
        <SpinnerLoading :size="40" :color="'#888'"/>

        <template #footer v-if="currentGame?.metadata?.steamid !== 0">
            <button class="save-bottom-btn" disabled>
                <SaveIcon :size="18" :stroke-width="2" />
                Save Changes
            </button>
        </template>
    </WindowFrame>

    <WindowFrame v-else-if="games.length === 0" title="Configure Games" :centered="true">
        <template #header-action>
            <button @click="goBack" class="back-btn" title="Home">
                <HomeIcon :size="18" :stroke-width="2" />
            </button>
        </template>

        <div class="empty-state">
            No games found in the selected folder.
        </div>
    </WindowFrame>

    <WindowFrame v-else-if="currentGame.metadata.steamid === 0" title="Configure Games">
        <template #header-action>
            <button @click="goBack" class="back-btn" title="Home">
                <HomeIcon :size="18" :stroke-width="2" />
            </button>
        </template>
        <template #header-section>
            <GameSelector :game-names="gameNames" v-model="currentGameIndex" @change="loadData" />
        </template>
        <div class="search-results">
            <div v-for="result in suggestions" :key="result.appId" @click="selectSteamId(result)" class="search-result-item">
                <span>{{ result.name }}</span>
                <span class="app-id">ID: {{ result.appId }}</span>
            </div>
        </div>
    </WindowFrame>

    <WindowFrame v-else title="Configure Games">
        <template #header-action>
            <button @click="goBack" class="back-btn" title="Home">
                <HomeIcon :size="18" :stroke-width="2" />
            </button>
        </template>
        <template #header-section>
            <GameSelector :game-names="gameNames" v-model="currentGameIndex" @change="loadData" />
        </template>
        <!-- Metadata & Assets -->
        <div class="config-section">
            <div class="metadata-section">
                <div class="metadata-grid">
                    <div v-if="currentGame.infos.developer" class="metadata-item">
                        <span class="metadata-label">Developer:</span>
                        <span class="metadata-value">{{ currentGame.infos.developer }}</span>
                    </div>
                    <div v-if="currentGame.infos.publisher" class="metadata-item">
                        <span class="metadata-label">Publisher:</span>
                        <span class="metadata-value">{{ currentGame.infos.publisher }}</span>
                    </div>
                    <div v-if="currentGame.infos.releasedate" class="metadata-item">
                        <span class="metadata-label">Release Date:</span>
                        <span class="metadata-value">{{ currentGame.infos.releasedate }}</span>
                    </div>
                    <div v-if="currentGame.infos.genre" class="metadata-item">
                        <span class="metadata-label">Genre:</span>
                        <span class="metadata-value">{{ currentGame.infos.genre }}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Players:</span>
                        <span class="metadata-value">{{ currentGame.infos.players }}</span>
                    </div>
                    <div v-if="currentGame.infos.rating" class="metadata-item">
                        <span class="metadata-label">Rating:</span>
                        <span class="metadata-value">{{ currentGame.infos.rating * 5 }} / 5</span>
                    </div>
                </div>
                <div class="metadata-desc" v-if="currentGame.infos.desc">
                    {{ currentGame.infos.desc }}
                </div>
            </div>

            <div class="assets-section">
                <AssetViewer
                    :assets="marquees"
                    v-model="currentGame.metadata.marquee"
                    label="Marquee"
                    type="image"
                />
                <AssetViewer
                    :assets="screenshots"
                    v-model="currentGame.metadata.screenshot"
                    label="Screenshot"
                    type="image"
                />
                <AssetViewer
                    :assets="miximages"
                    v-model="currentGame.metadata.miximage"
                    label="Mix Image"
                    type="image"
                />
                <AssetViewer
                    :assets="videos"
                    v-model="currentGame.metadata.video"
                    label="Video"
                    type="video"
                />
                <AssetViewer
                    :assets="covers"
                    v-model="currentGame.metadata.cover"
                    label="Cover"
                    type="image"
                />
            </div>
        </div>
        <template #footer>
            <button @click="synchronize" class="save-bottom-btn" :disabled="isSyncing">
                <SpinnerLoading v-if="isSyncing" :size="18" :color="'#fff'" />
                <SaveIcon v-else :size="18" :stroke-width="2" />
                {{ isSyncing ? 'Saving...' : 'Save Changes' }}
            </button>
        </template>
    </WindowFrame>
</template>

<style scoped>
.back-btn
{
    padding: 0.5rem;
    background-color: transparent;
    color: #666;
    border: 1px solid #d0d0d0;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.back-btn:hover
{
    background-color: #f5f5f5;
    border-color: #b0b0b0;
}

.search-results
{
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.search-result-item
{
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.7rem 0.85rem;
    background-color: #fafafa;
    border: 1px solid #e8e8e8;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s ease;
    gap: 10px;
}

.search-result-item:hover
{
    background-color: #f0f0f0;
    border-color: #d0d0d0;
}

.app-id
{
    font-size: 0.7rem;
    color: #999;
    flex-shrink: 0;
    white-space: nowrap;
}

.config-section
{
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.metadata-section
{
    padding: 0.75rem;
    background-color: #fafafa;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
}

.metadata-grid
{
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
}

.metadata-item
{
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.metadata-label
{
    font-size: 0.7rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}

.metadata-value
{
    font-size: 0.8rem;
    color: #3c3c3c;
    font-weight: 400;
}

.metadata-desc
{
    margin-top: 1rem;
    font-size: 0.8rem;
    color: #5a5a5a;
    line-height: 1.4;
    text-align: center;
}

.check-icon
{
    color: #4a4a4a;
    flex-shrink: 0;
}

.assets-section
{
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.save-bottom-btn
{
    padding: 0.75rem 0;
    background-color: #4a4a4a;
    color: #fff;
    border: 1px solid #4a4a4a;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 400;
    letter-spacing: 0.3px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
    width: 200px;
    justify-content: center;
}

.save-bottom-btn:hover
{
    background-color: #5a5a5a;
    border-color: #5a5a5a;
}

.save-bottom-btn:active
{
    transform: scale(0.98);
}

.save-bottom-btn:disabled
{
    opacity: 0.6;
    cursor: not-allowed;
}

.empty-state
{
    text-align: center;
    color: #999;
    font-size: 0.9rem;
    font-style: italic;
}
</style>
