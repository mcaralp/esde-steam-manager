<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface Props
{
    gameNames: string[]
}

const props = defineProps<Props>()
const currentIndex = defineModel<number>({ default: 0 })
const emit = defineEmits<{change: [index: number]}>()

const currentGameName = computed(() => props.gameNames[currentIndex.value] || 'Unnamed Game')

function previousGame()
{
    if (currentIndex.value > 0)
    {
        currentIndex.value--
        emit('change', currentIndex.value)
    }
}

function nextGame()
{
    if (currentIndex.value < props.gameNames.length - 1)
    {
        currentIndex.value++
        emit('change', currentIndex.value)
    }
}
</script>

<template>
    <div class="game-selector">
        <button @click="previousGame" :disabled="currentIndex === 0" class="nav-btn">
            <ChevronLeft :size="18" :stroke-width="2" />
        </button>
        <div class="game-name">
            {{ currentGameName }} ({{ currentIndex + 1 }}/{{ gameNames.length }})
        </div>
        <button @click="nextGame" :disabled="currentIndex === gameNames.length - 1" class="nav-btn">
            <ChevronRight :size="18" :stroke-width="2" />
        </button>
    </div>
</template>

<style scoped>
.game-selector
{
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background-color: #fafafa;
    border-bottom: 1px solid #e8e8e8;
    flex-shrink: 0;
}

.nav-btn
{
    padding: 0.4rem;
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

.nav-btn:hover:not(:disabled)
{
    background-color: #f0f0f0;
    border-color: #b0b0b0;
}

.nav-btn:disabled
{
    opacity: 0.3;
    cursor: not-allowed;
}

.game-name
{
    flex: 1;
    font-size: 0.85rem;
    color: #3c3c3c;
    font-weight: 400;
    text-align: center;
}
</style>
