<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

defineOptions({
    name: 'Alert'
})

const props = defineProps<{
    message: string
    type?: 'error' | 'success' | 'warning' | 'info'
    show: boolean
    autoHideMs?: number
}>()

const emit = defineEmits<{
    (e: 'hidden'): void
    (e: 'update:show', value: boolean): void
}>()

const visible = ref<boolean>(props.show)
let hideTimer: number | null = null

function clearTimer() {
    if (hideTimer !== null) {
        clearTimeout(hideTimer)
        hideTimer = null
    }
}

function startTimer() {
    clearTimer()
    if (props.autoHideMs && props.autoHideMs > 0) {
        hideTimer = window.setTimeout(() => {
            visible.value = false
            emit('update:show', false)
            emit('hidden')
        }, props.autoHideMs)
    }
}

watch(() => props.show, (val) => {
    visible.value = val
    if (val) startTimer(); else clearTimer()
})

watch(() => props.autoHideMs, () => {
    if (visible.value) startTimer()
})

onMounted(() => {
    if (props.show) startTimer()
})

onBeforeUnmount(() => {
    clearTimer()
})
</script>

<template>
    <Transition name="slide-fade">
        <div v-if="visible" :class="`fixed top-4 right-4 z-50 alert border-none bg-yellow-500 max-w-md`">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current text-[var(--color-base-100)] shrink-0 h-6 w-6"
                fill="none" viewBox="0 0 24 24">
                <path v-if="type === 'error' || !type" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path v-if="type === 'success'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-[var(--color-base-100)]">{{ message }}</span>
        </div>
    </Transition>
</template>

<style scoped>
.slide-fade-enter-active {
    transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
    transition: all 0.3s ease-in;
}

.slide-fade-enter-from {
    transform: translateX(100px);
    opacity: 0;
}

.slide-fade-leave-to {
    transform: translateX(100px);
    opacity: 0;
}
</style>
