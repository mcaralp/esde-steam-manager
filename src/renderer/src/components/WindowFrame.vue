<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    title: string
    centered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    centered: false
})

const contentStyle = computed(() => ({
    justifyContent: props.centered ? 'safe center' : 'flex-start',
    alignItems: props.centered ? 'center' : 'stretch'
}))
</script>

<template>
    <div class="container">
        <div class="window">
            <div class="window-inside">
                <div class="header">
                    <img src="../assets/images/steam.svg" alt="Steam Logo" width="32" class="icon" />
                    <div class="title">{{ title }}</div>
                    <div class="header-action" v-if="$slots['header-action']">
                        <slot name="header-action"></slot>
                    </div>
                    <div v-else class="empty-icon"></div>
                </div>
                
                <div v-if="$slots['header-section']"  class="header-section">
                    <slot name="header-section"></slot>
                </div>
                
                <div class="content" :style="contentStyle">
                    <slot></slot>
                </div>
                
                <div v-if="$slots.footer" class="footer-section">
                    <slot name="footer"></slot>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.container
{
    display: flex;
    flex-direction: column;
    justify-content: safe center;
    align-items: safe center;
    width: 100%;
    height: 100%;
}

.window
{
    width: 100%;
    max-width: 550px;
    min-width: 350px;
    height: 100%;
    min-height: 350px;
    max-height: 550px;
    padding: 30px;
    display: flex;
    align-items: stretch;
}

.window-inside
{
    background-color: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
}

.header
{
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #e8e8e8;
    flex-shrink: 0;
}

.title
{
    flex: 1;
    font-size: 0.9rem;
    color: #3c3c3c;
    font-weight: 400;
    text-align: center;
}

.header-action
{
    display: flex;
    align-items: center;
}

.empty-icon
{
    width: 32px;
    height: 32px;
}

.header-section
{
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
}

.content
{
    padding: 0 1.25rem;
    margin: 1.25rem 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow-y: auto;
    overflow-x: hidden;
    flex-grow: 1;
}

.footer-section
{
    padding: 1.25rem;
    border-top: 1px solid #e8e8e8;
    display: flex;
    justify-content: center;
    flex-shrink: 0;
}
</style>
