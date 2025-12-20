<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import QRCode from 'qrcode'
import WindowFrame from './WindowFrame.vue'
import SpinnerLoading from './SpinnerLoading.vue'
import { LogOutIcon, RotateCwIcon, FolderIcon, FolderPlusIcon } from 'lucide-vue-next'
import type { UserInfo, QrEvent } from '../../../shared/types'
import sleep from '../assets/ts/sleep'

const userInfo = ref<UserInfo | null>(null)
const qrCodeUrl = ref<string | null>(null)
const qrCanvas = ref<HTMLCanvasElement | null>(null)
const knownFolders = ref<string[]>([])

const generalState = ref<'loading' | 'connected' | 'qr-login'>('loading')
const qrCodeState = ref<'waiting' | 'loading' | 'error'>('waiting')

const emit = defineEmits<{
    openFolder: [folder: string]
}>()

async function checkUserInfo()
{
    try
    {
        userInfo.value = await window.api.getUserInfo()
        // Small delay to show loading state
        await sleep(300)
        generalState.value = 'connected'
    }
    catch (err: any)
    {
        await startQrLogin()
    }
}

async function retryQrLogin()
{
    qrCodeState.value = 'loading'
    await startQrLogin()
}

async function startQrLogin()
{
    try
    {
        await window.api.startQrLogin(async (event: QrEvent) =>
        {
            if (event.type === 'qr-started')
            {
                generalState.value = 'qr-login'
                qrCodeState.value = 'waiting'
                qrCodeUrl.value = event.qrCode

                await nextTick()
                await QRCode.toCanvas(qrCanvas.value, event.qrCode, {
                    width: 200,
                    margin: 2,
                    color: {
                        dark: '#2c2c2c',
                        light: '#FFFFFF'
                    }
                })
            }
            else if (event.type === 'qr-scanned')
            {
                qrCodeState.value = 'loading'
            }
        })
        await checkUserInfo()
    }
    catch (err: any)
    {
        qrCodeState.value = 'error'
    }
}

async function disconnect()
{
    generalState.value = 'loading'
    await window.api.disconnect()
    await startQrLogin()
}

async function addFolder()
{
    try
    {
        const folder = await window.api.addESFolder()
        knownFolders.value.unshift(folder)
        if (folder)
        {
            knownFolders.value = await window.api.getESFolders()
        }
    }
    catch (err: any)
    {
        console.error('Error adding folder:', err)
    }
}

function openFolder(folder: string)
{
    emit('openFolder', folder)
}

onMounted(async () =>
{
    knownFolders.value = await window.api.getESFolders()
    await checkUserInfo()
})
</script>

<template>
    <WindowFrame v-if="generalState === 'loading'" title="Steam login" :centered="true">
        <SpinnerLoading :size="50" color="#888" />
    </WindowFrame>

    <WindowFrame v-else-if="generalState === 'connected'" :title="userInfo?.accountName ?? 'Steam User'">
        <template #header-action>
            <button @click="disconnect" class="disconnect-icon-btn" title="Disconnect">
                <LogOutIcon :size="18" :stroke-width="2" />
            </button>
        </template>

        <template #header-section>
            <button @click="addFolder" class="select-folder-btn">
                <FolderPlusIcon :size="20" :stroke-width="2" />
                Add ES-DE folder
            </button>

            <h3>Known Folders</h3>
        </template>
        <div v-if="knownFolders.length === 0" class="empty-state">
            No ES-DE folders added yet.
        </div>
        <ul v-else>
            <li v-for="folder in knownFolders" :key="folder" @click="openFolder(folder)">
                <FolderIcon :size="18" :stroke-width="2" class="folder-icon" />
                <span class="folder-path">{{ folder }}</span>
            </li>
        </ul>
    </WindowFrame>

    <WindowFrame v-else-if="generalState === 'qr-login'" title="Steam login" :centered="true">
        <div class="qr-container">
            <canvas ref="qrCanvas" class="qr-code" :class="{ 'blurred': qrCodeState !== 'waiting' }"></canvas>
            <div v-if="qrCodeState === 'loading'" class="qr-overlay">
                <SpinnerLoading :size="40" color="#fff" />
            </div>
            <div v-else-if="qrCodeState === 'error'" class="qr-overlay" @click="retryQrLogin">
                <RotateCwIcon :size="30" color="#fff" />
            </div>
        </div>
        <p class="status">
            Please scan the QR code with the Steam Mobile app to log in.
        </p>
    </WindowFrame>
</template>

<style scoped>
.disconnect-icon-btn
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

.disconnect-icon-btn:hover
{
    background-color: #f5f5f5;
    border-color: #b0b0b0;
}

.disconnect-icon-btn:active
{
    transform: scale(0.95);
}

.select-folder-btn
{
    padding: 0.75rem 1.25rem;
    background-color: #4a4a4a;
    color: #fff;
    border: 1px solid #4a4a4a;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 400;
    letter-spacing: 0.3px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
    margin: 1.25rem 1.25rem 0 1.25rem;
}

.select-folder-btn:hover
{
    background-color: #5a5a5a;
    border-color: #5a5a5a;
}

.select-folder-btn:active
{
    transform: scale(0.98);
}

h3
{
    font-size: 0.75rem;
    color: #5a5a5a;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 1.25rem 0 0 0;
    text-align: center;
}

ul
{
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

ul li
{
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.7rem 0.85rem;
    background-color: #fafafa;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

ul li:hover
{
    background-color: #f0f0f0;
    border-color: #d0d0d0;
}

ul li:active
{
    transform: scale(0.99);
}

.empty-state
{
    padding: 0 1.5rem;
    text-align: center;
    color: #999;
    font-size: 0.85rem;
    font-weight: 300;
}

.folder-icon
{
    flex-shrink: 0;
}

.folder-path
{
    font-size: 0.8rem;
    color: #5a5a5a;
    font-weight: 300;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.status
{
    color: #5a5a5a;
    font-size: 0.8rem;
    margin-top: 2rem;
    font-weight: 300;
    line-height: 1.5;
    text-align: center;
}

.qr-container
{
    position: relative;
}

.qr-code
{
    display: block;
    transition: filter 0.3s ease;
}

.qr-code.blurred
{
    filter: blur(8px);
}

.qr-overlay
{
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: opacity 0.3s ease;
}

.qr-overlay:hover
{
    opacity: 0.8;
}
</style>
