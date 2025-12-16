<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import WindowFrame from './WindowFrame.vue'
import GameSelector from './GameSelector.vue'
import { CheckIcon, HomeIcon, SaveIcon, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { GameSearchResult, ESGameSteamMetadata, ESGame } from '../../../shared/types'
import SpinnerLoading from './SpinnerLoading.vue'

interface AssetCategory
{
    key: keyof Pick<ESGameSteamMetadata, 'marquee' | 'screenshot' | 'video' | 'cover'>
    label: string
    options: string[]
}

// Props
const props = defineProps<{ folder: string }>()

// Emits
const emit = defineEmits<{goBack: []}>()

// Mock data - will be replaced by API call
const games = ref<ESGame[]>([])

const currentGameIndex = ref(0)
const suggestions = ref<GameSearchResult[]>([])
const assetIndices = ref<Record<string, number>>({
    marquee: 0,
    screenshot: 0,
    video: 0,
    cover: 0
})

const currentGame = computed(() => {
    return games.value[currentGameIndex.value]
})

const gameNames = computed(() => {
    return games.value.map(computeName)
})

const hasChanges = computed(() => {
    return true
})

const assetCategories = ref<AssetCategory[]>([
    { key: 'marquee', label: 'Marquee', options: [] },
    { key: 'screenshot', label: 'Screenshot', options: [] },
    { key: 'video', label: 'Video', options: [] },
    { key: 'cover', label: 'Cover', options: [] }
])

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
async function loadSuggestions()
{
    suggestions.value = []
    if (!currentGame.value || currentGame.value.metadata.steamid)
    {
        return
    }
    suggestions.value = await window.api.searchGames(computeName(currentGame.value))
}

// Select a Steam ID from suggestions
async function selectSteamId(result: GameSearchResult)
{
    // currentGame.value.metadata.steamid = result.appId
    suggestions.value = []
    const gameInfo = await window.api.getGameInfo(result.appId)
    console.log(gameInfo)
    
    currentGame.value.metadata.steamid = result.appId
    currentGame.value.infos.desc = gameInfo.short_description
    currentGame.value.infos.developer = gameInfo.developers?.join(', ')
    currentGame.value.infos.publisher = gameInfo.publishers?.join(', ')
    currentGame.value.infos.releasedate = gameInfo.common.steam_release_date
    currentGame.value.infos.genre = gameInfo.genres?.map((g: any) => g.description).join(', ')
    currentGame.value.infos.rating = Math.round(gameInfo.reviews_summary?.review_score) / 2
    currentGame.value.infos.players = gameInfo.categories?.some((c: any) => c.id === 1) || false

    console.log(currentGame.value.infos)
 
    // assetCategories.value = [
    //     { key: 'marquee', label: 'Marquee', options: ['marquee1.jpg', 'marquee2.jpg', 'marquee3.jpg'] },
    //     { key: 'screenshot', label: 'Screenshot', options: ['screen1.jpg', 'screen2.jpg', 'screen3.jpg'] },
    //     { key: 'video', label: 'Video', options: ['video1.mp4', 'video2.mp4'] },
    //     { key: 'cover', label: 'Cover', options: ['cover1.jpg', 'cover2.jpg', 'cover3.jpg'] }
    // ]
}

function selectAsset(category: keyof Pick<ESGameSteamMetadata, 'marquee' | 'screenshot' | 'video' | 'cover'>, asset: string)
{
    currentGame.value.metadata[category] = asset
}

function previousAsset(categoryKey: string)
{
    const category = assetCategories.value.find(c => c.key === categoryKey)
    if (!category || category.options.length === 0) return
    
    assetIndices.value[categoryKey] = (assetIndices.value[categoryKey] - 1 + category.options.length) % category.options.length
    selectAsset(categoryKey as any, category.options[assetIndices.value[categoryKey]])
}

function nextAsset(categoryKey: string)
{
    const category = assetCategories.value.find(c => c.key === categoryKey)
    if (!category || category.options.length === 0) return
    
    assetIndices.value[categoryKey] = (assetIndices.value[categoryKey] + 1) % category.options.length
    selectAsset(categoryKey as any, category.options[assetIndices.value[categoryKey]])
}

async function synchronize()
{
    // TODO: Call window.api.setESInfos(props.folder, { games: games.value })
    console.log('Synchronizing games to folder:', props.folder, games.value)
}

function goBack()
{
    emit('goBack')
}

onMounted(async () =>
{
    try 
    {    
        games.value = await window.api.getESGames(props.folder)
    }
    catch (err)
    {
    }
    await loadSuggestions()
})

</script>

<template>
    <WindowFrame v-if="games.length === 0" title="Configure Games" :centered="true">
        <template #header-action>
            <button @click="goBack" class="back-btn" title="Home">
                <HomeIcon :size="18" :stroke-width="2" />
            </button>
        </template>

        <div class="empty-state">
            No games found in the selected folder.
        </div>
    </WindowFrame>

    <WindowFrame v-else-if="currentGame.metadata.steamid === 0" title="Configure Games" :centered="suggestions.length === 0">
        <template #header-action>
            <button @click="goBack" class="back-btn" title="Home">
                <HomeIcon :size="18" :stroke-width="2" />
            </button>
        </template>

        <template #header-section>
            <GameSelector :game-names="gameNames" v-model="currentGameIndex" @change="loadSuggestions" />
        </template>

        <SpinnerLoading v-if="suggestions.length === 0" :size="40" :color="'#888'"/>
        <div v-else class="search-results">
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
            <GameSelector :game-names="gameNames" v-model="currentGameIndex" @change="loadSuggestions" />
        </template>

        <!-- Metadata & Assets -->
        <div class="config-section">
            <div class="metadata-section">
                <div class="metadata-grid">
                    <div class="metadata-item">
                        <span class="metadata-label">Steam ID:</span>
                        <span class="metadata-value">{{ currentGame.metadata.steamid }}</span>
                    </div>
                    <div v-if="currentGame.infos.releasedate" class="metadata-item">
                        <span class="metadata-label">Release Date:</span>
                        <span class="metadata-value">{{ currentGame.infos.releasedate }}</span>
                    </div>
                    <div v-if="currentGame.infos.developer" class="metadata-item">
                        <span class="metadata-label">Developer:</span>
                        <span class="metadata-value">{{ currentGame.infos.developer }}</span>
                    </div>
                    <div v-if="currentGame.infos.publisher" class="metadata-item">
                        <span class="metadata-label">Publisher:</span>
                        <span class="metadata-value">{{ currentGame.infos.publisher }}</span>
                    </div>
                    <div v-if="currentGame.infos.genre" class="metadata-item">
                        <span class="metadata-label">Genre:</span>
                        <span class="metadata-value">{{ currentGame.infos.genre }}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Multiplayer:</span>
                        <span class="metadata-value">{{ currentGame.infos.players }}</span>
                    </div>
                    <div v-if="currentGame.infos.rating" class="metadata-item">
                        <span class="metadata-label">Rating:</span>
                        <span class="metadata-value">{{ currentGame.infos.rating }} / 5</span>
                    </div>
                </div>
            </div>

            <p class="help-text">Use the arrows to browse through available assets for each category.</p>

            <div class="assets-section">
                <div v-for="category in assetCategories" :key="category.key" class="asset-category">
                    <h4>{{ category.label }}</h4>
                    <div v-if="category.options.length === 0" class="no-assets">
                        No assets available
                    </div>
                    <div v-else class="asset-carousel">
                        <button @click="previousAsset(category.key)" class="carousel-btn carousel-btn-prev" :disabled="category.options.length <= 1">
                            <ChevronLeft :size="20" :stroke-width="2.5" />
                        </button>
                        <div class="asset-display">
                            <div class="asset-image-large">
                                <img :src="category.options[assetIndices[category.key]]" :alt="category.label" />
                            </div>
                            <div class="asset-counter">
                                {{ assetIndices[category.key] + 1 }} / {{ category.options.length }}
                            </div>
                        </div>
                        <button @click="nextAsset(category.key)" class="carousel-btn carousel-btn-next" :disabled="category.options.length <= 1">
                            <ChevronRight :size="20" :stroke-width="2.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <template #footer>
            <button @click="synchronize" class="save-bottom-btn" :disabled="!hasChanges">
                <SaveIcon :size="18" :stroke-width="2" />
                Save Changes
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

.help-text
{
    padding: 2rem;
    text-align: center;
    color: #999;
    font-size: 0.8rem;
    font-style: italic;
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

.check-icon
{
    color: #4a4a4a;
    flex-shrink: 0;
}

.assets-section
{
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.asset-category h4
{
    font-size: 0.75rem;
    color: #5a5a5a;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 0.5rem 0;
    text-align: left;
}

.no-assets
{
    padding: 1rem;
    text-align: center;
    color: #999;
    font-size: 0.75rem;
    font-weight: 300;
}

.asset-carousel
{
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.carousel-btn
{
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    background-color: #4a4a4a;
    color: #fff;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.carousel-btn:hover:not(:disabled)
{
    background-color: #5a5a5a;
    transform: scale(1.1);
}

.carousel-btn:disabled
{
    opacity: 0.3;
    cursor: not-allowed;
}

.asset-display
{
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.asset-image-large
{
    width: 100%;
    aspect-ratio: 16 / 9;
    background-color: #fafafa;
    border: 2px solid #e8e8e8;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

.asset-image-large img
{
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.asset-counter
{
    text-align: center;
    font-size: 0.75rem;
    color: #888;
}

.save-bottom-btn
{
    padding: 0.75rem 2rem;
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

.empty-state
{
    text-align: center;
    color: #999;
    font-size: 0.9rem;
    font-style: italic;
}
</style>
