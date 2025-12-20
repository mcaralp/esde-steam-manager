<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import SpinnerLoading from './SpinnerLoading.vue'

interface Props
{
    assets: string[]
    label?: string
    type?: 'image' | 'video'
}

const props = withDefaults(defineProps<Props>(),
{
    type: 'image',
    label: ''
})

const model = defineModel<string>({ required: true })

const currentIndex = computed(() =>
{
    if (props.assets.length === 0) return 0
    const index = props.assets.indexOf(model.value)
    return index >= 0 ? index : 0
})

const hasMultipleAssets = computed(() => props.assets.length > 1)

const isLoading = ref(true)

function onImageLoad()
{
    isLoading.value = false
}

function onImageError()
{
    isLoading.value = false
}

function previousAsset()
{
    if (!hasMultipleAssets.value) return
    
    const newIndex = (currentIndex.value - 1 + props.assets.length) % props.assets.length
    model.value = props.assets[newIndex]
}

function nextAsset()
{
    if (!hasMultipleAssets.value) return
    
    const newIndex = (currentIndex.value + 1) % props.assets.length
    model.value = props.assets[newIndex]
}

</script>

<template>
    <div class="asset-viewer">
        <div v-if="label" class="asset-label">
            {{ label }}
        </div>
        
        <div class="asset-container">
            <!-- Navigation Button - Previous -->
            <button
                class="nav-button prev"
                :disabled="!hasMultipleAssets"
                @click="previousAsset"
                type="button"
            >
                <ChevronLeft :size="24" />
            </button>

            <!-- Asset Display -->
            <div class="asset-display">
                <template v-if="assets.length > 0">
                    <img
                        v-if="type === 'image'"
                        :src="assets[currentIndex]"
                        :alt="label"
                        class="asset-image"
                        @load="onImageLoad"
                        @error="onImageError"
                    />
                    <video
                        v-else-if="type === 'video'"
                        :src="assets[currentIndex]"
                        controls
                        class="asset-video"
                        @loadeddata="onImageLoad"
                        @error="onImageError"
                    />
                    <div v-if="isLoading" class="spinner-overlay">
                        <SpinnerLoading :size="40" :color="'#333'" />
                    </div>
                </template>
                <div v-else class="asset-empty">
                    No asset available
                </div>
            </div>

            <!-- Navigation Button - Next -->
            <button
                class="nav-button next"
                :disabled="!hasMultipleAssets"
                @click="nextAsset"
                type="button"
            >
                <ChevronRight :size="24" />
            </button>
        </div>

        <!-- Asset Counter -->
        <div class="asset-counter" v-if="assets.length > 0">
            {{ currentIndex + 1 }} / {{ assets.length }}
        </div>
    </div>
</template>

<style scoped>
.asset-viewer
{
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
}

.asset-label
{
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.25rem;
}

.asset-container
{
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    position: relative;
}

.asset-display
{
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f3f4f6;
    border-radius: 0.5rem;
    overflow: hidden;
    min-height: 200px;
    max-height: 400px;
}

.asset-image,
.asset-video
{
    max-width: 100%;
    max-height: 400px;
    object-fit: contain;
    display: block;
}

.spinner-overlay
{
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}

.asset-empty
{
    color: #9ca3af;
    font-size: 0.875rem;
    text-align: center;
    padding: 2rem;
}

.nav-button
{
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    background-color: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
}

.nav-button:hover:not(:disabled)
{
    background-color: #f9fafb;
    border-color: #9ca3af;
}

.nav-button:active:not(:disabled)
{
    background-color: #f3f4f6;
}

.nav-button:disabled
{
    opacity: 0.4;
    cursor: not-allowed;
}

.asset-counter
{
    text-align: center;
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
}
</style>
