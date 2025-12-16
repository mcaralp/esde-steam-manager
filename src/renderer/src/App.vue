<script setup lang="ts">
import { ref } from 'vue'
import LoginView from './components/LoginView.vue'
import GameConfigView from './components/GameConfigView.vue'

const currentView = ref<'login' | 'config'>('login')
const selectedFolder = ref<string>('')

function handleOpenFolder(folder: string)
{
    selectedFolder.value = folder
    currentView.value = 'config'
}

function handleGoBack()
{
    currentView.value = 'login'
}
</script>

<template>
    <LoginView v-if="currentView === 'login'" @openFolder="handleOpenFolder" />
    <GameConfigView v-else-if="currentView === 'config'" :folder="selectedFolder" @goBack="handleGoBack" />
</template>

<style scoped>
</style>