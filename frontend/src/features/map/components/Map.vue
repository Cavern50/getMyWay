<script setup lang="ts">
import { onMounted, ref, onUnmounted, watch, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import { MAP_CONSTANTS } from '../lib/constants'
import { MapsTypes } from '../lib/types'
import { Alert } from '@/shared/ui'
import { useMeetingSocket } from '../composables/useMeetingSocket'
import { meetingApi, type Meeting } from '../api/meetingApi'
import { useAuthStore } from '@/features/auth/model/useAuthStore'
import { joinMeetingByLink, loadMeetingFromUrl, updateUserRoute } from '../lib/helpers'
import { useYaMapInit } from '../composables/useYaMapInit'


const authStore = useAuthStore()

const map = ref<any>(null);
const mapContainer = ref<HTMLDivElement | null>(null);
const meetStep = ref<MapsTypes.uiStep>(MapsTypes.uiStep.FIND_MEET_POINT)
const meetPoint = ref<MapsTypes.Coords | null>(null)
const meetingLink = ref<string>('')
const currentMeeting = ref<Meeting | null>(null)
const isCopiedAlertVisible = ref<boolean>(false)
const isCreatingMeeting = ref<boolean>(false)

// WebSocket для отслеживания позиций
const {
    connect,
    disconnect,
    joinMeeting,
    updateLocation,
    leaveMeeting,
    participantLocations,
    isConnected
} = useMeetingSocket()







// // Создание встречи
async function createMeetingLink() {
    if (!meetPoint.value) return

    isCreatingMeeting.value = true
    try {
        const [lon, lat] = meetPoint.value

        const meeting = await meetingApi.createMeeting({
            title: 'Встреча',
            location: {
                coordinates: [lon, lat],
            }
        })

        currentMeeting.value = meeting
        meetingLink.value = `${window.location.origin}${window.location.pathname}?meetLink=${meeting.meetingLink}`

        // Подключаемся к WebSocket и присоединяемся к встрече
        connect()
        joinMeeting(meeting.meetingLink)

        // Начинаем отслеживание позиции
        // startLocationTracking()

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(meetingLink.value).catch(() => { })
        }

        meetStep.value = MapsTypes.uiStep.COMPLETE
    } catch (error) {
        console.error('Error creating meeting:', error)
        alert('Ошибка при создании встречи')
    } finally {
        isCreatingMeeting.value = false
    }
}


function copyMeetingLink() {
    if (!meetingLink.value) return
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(meetingLink.value)
        isCopiedAlertVisible.value = true
        setTimeout(() => {
            isCopiedAlertVisible.value = false
        }, 3000)
    }
}

useYaMapInit({
    mapContainer,
    meetPoint,
    map,
    meetStep,
    onInit: () => new Promise((res) => 1),
    onResultSelect: () => 2
})

</script>

<template>
    <div class="p-4 h-screen">
        <div ref="mapContainer" style="width: 100%; height: 50vh;">

        </div>

        <div class="mt-4 w-64 space-y-2">
            <div v-if="isConnected" class="mb-2">
                <div class="badge badge-success">Подключено</div>
                <div class="text-xs mt-1">
                    Участников: {{ participantLocations.length + 1 }}
                </div>
            </div>
            <ul class="ml-6 text-m font-medium list-decimal">
                <li v-for="item in MAP_CONSTANTS.LIST_ITEMS" :key="item.id"
                    :class="meetStep === item.step ? 'list-item' : 'list-item opacity-10'">
                    {{ item.name }}</li>
            </ul>
            <div v-if="meetStep === MapsTypes.uiStep.CREATE_MEETING_LINK">
                <button type="button" class="btn btn-primary w-full" @click="createMeetingLink"
                    :disabled="isCreatingMeeting">
                    <span v-if="isCreatingMeeting" class="loading loading-spinner"></span>
                    {{ isCreatingMeeting ? 'Создание...' : 'Создать встречу' }}
                </button>
            </div>
            <div v-if="meetStep === MapsTypes.uiStep.COMPLETE && meetingLink"
                class="text-xs mt-4 underline cursor-pointer select-all" @click="copyMeetingLink"
                title="Нажмите, чтобы скопировать">
                {{ meetingLink }}
            </div>
            <Alert :show="isCopiedAlertVisible" type="success" message="Ссылка на встречу скопирована в буфер обмена" />
        </div>
    </div>
</template>
