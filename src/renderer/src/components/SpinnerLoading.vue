<template>
    <div v-show="loading" class="lds-dual-ring" :style="{ width: `${size}px`, height: `${size}px` }">
        <div class="lds-dual-ring-after" :style="spinnerStyle"></div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props
{
    loading?: boolean
    size?: number
    color?: string
    duration?: string
}

const props = withDefaults(defineProps<Props>(), {
    loading: true,
    size: 50,
    color: '#2c2c2c',
    duration: '1.2s'
})

const spinnerStyle = computed(() => ({
    borderWidth: `${props.size * 0.075}px`,
    borderColor: `${props.color} transparent`,
    animationDuration: props.duration
}))
</script>

<style scoped>
.lds-dual-ring
{
    display: inline-block;
}
.lds-dual-ring-after
{
    content: ' ';
    display: block;

    /* ratio: calc(64px / 80px) */
    width: 80%;
    height: 80%;
    /* ratio: calc(8px / 80px) */
    margin: 10%;

    border-radius: 50%;
    border: 6px solid #000;
    border-color: #000 transparent #000 transparent;
    animation-name: lds-dual-ring;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
}
@keyframes lds-dual-ring
{
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>