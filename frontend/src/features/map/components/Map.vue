<script setup lang="ts">
import { ref, watch, shallowRef } from 'vue'
import { MAP_CONSTANTS } from '../lib/constants'
import { MapsTypes } from '../lib/types'
import { Alert } from '@/shared/ui'
import { areCoordsValid, copyToBuffer, getQueryParameter } from '@/shared/lib/helpers'
import { useMeetingSocket } from '../composables/useMeetingSocket'
import { type Meeting } from '../api/meetingApi'
import { setMeetingPlacemark, addRoute } from '../lib/helpers'
import { useYaMapInit } from '../composables/useYaMapInit'
import { useGeolocationWatch } from '../composables/useGeolocationWatch'
import { useMeeting, useCreateMeeting, useJoinMeeting } from '../model/useMapQuery'
import type { AxiosError } from 'axios'
import { toRaw } from 'vue'
import { useAuthStore } from '@/features/auth/model/useAuthStore'

const map = shallowRef<any>(null)
const mapContainer = ref<HTMLDivElement | null>(null);

const meetStep = ref<MapsTypes.uiStep>(MapsTypes.uiStep.FIND_MEET_POINT)
const meetPoint = ref<MapsTypes.MeetPoint | null>(null)
const meetingLink = ref<string>(getQueryParameter('meetLink'))
const yaRoutes = ref<Record<string, any>>({});

const isCopiedAlertVisible = ref<boolean>(false)

const userRoute = shallowRef<any>(null);

const authStore = useAuthStore();

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


const { coords } = useGeolocationWatch({
    enableHighAccuracy: true,
    timeout: 1000,
});

const { data } = useMeeting(meetingLink.value);
const createMeetingMutation = useCreateMeeting();
const joinMeetingMutation = useJoinMeeting();

// // Создание встречи
const createMeetingLink = async () => {
    if (!meetPoint.value) return;

    createMeetingMutation.mutate(
        {
            title: meetPoint.value.name,
            location: {
                coordinates: meetPoint.value.coords,
            }
        },
        {
            onSuccess: (meeting: Meeting) => {
                meetingLink.value = `${window.location.origin}${window.location.pathname}?meetLink=${meeting.meetingLink}`

                connect()
                joinMeeting(meeting.meetingLink)

                if (navigator.clipboard) {
                    navigator.clipboard.writeText(meetingLink.value)
                }

                meetStep.value = MapsTypes.uiStep.COMPLETE
            },
            onError: (error: AxiosError) => {
                console.error('Error creating meeting:', error)
                alert('Ошибка при создании встречи')
            }
        }
    )
}

const unk = {} as unknown;
unk.toString()

const copyMeetingLink = () => copyToBuffer(meetingLink.value, () => {
    isCopiedAlertVisible.value = true
    setTimeout(() => {
        isCopiedAlertVisible.value = false
    }, 3000)
})

watch([coords, meetPoint], ([newCoords, newMeetPoint]) => {
    // Обновление маршрута при изменении координат
    if (userRoute.value && areCoordsValid(newCoords) && newMeetPoint && data.value) {
        console.log('WOW UPDATED')
        updateLocation(data.value._id, newCoords);
        userRoute.value?.model.setReferencePoints([newCoords, newMeetPoint])
    }

    // Создание нового маршрута при изменении точки встречи
    if (newMeetPoint !== null && userRoute.value === null) {
        const currentCoords = coords.value;
        if (areCoordsValid(currentCoords)) {
            const route = addRoute({
                coords: { start: currentCoords, finish: newMeetPoint.coords },
                map
            });
            userRoute.value = route;
        }
    }

    // Обновление метки при изменении точки встречи
    if (newMeetPoint !== null && data.value) {
        setMeetingPlacemark({ meeting: data.value, map })
    }
})

watch(participantLocations, (newLocations) => {
    newLocations.forEach((participant) => {
        addRoute({ coords: { start: participant.coordinates, finish: data.value.location.coordinates }, map })
    })
})

useYaMapInit({
    mapContainer,
    meetPoint,
    map,
    meetStep,
    onYaMapsReady: async () => {
        if (meetingLink.value && data.value) {
            const participantLocations = toRaw(data.value.participantLocations).filter((participant) => participant.userId !== authStore.userId);
            participantLocations.forEach((participant) => {
                addRoute({ coords: { start: participant.coordinates, finish: data.value.location.coordinates }, map })
            })
            setMeetingPlacemark({ map, meeting: data.value });
            connect();
            joinMeeting(meetingLink.value);
            joinMeetingMutation.mutate(
                meetingLink.value,
                {
                    onSuccess: (meeting: Meeting) => { },
                    onError: (error: AxiosError) => {
                        console.error('Error creating meeting:', error)
                        alert('Ошибка при создании встречи')
                    }
                }
            )
            const currentCoords = coords.value;
            if (areCoordsValid(currentCoords)) {
                const route = addRoute({ coords: { start: currentCoords, finish: data.value.location.coordinates }, map })
                userRoute.value = route;
            }
            meetPoint.value = data.value.location.coordinates;
        }
    }
});

</script>

<template>
    <div class="p-4 h-screen">
        <div ref="mapContainer" style="width: 100%; height: 50vh;"></div>

        <div class="mt-4 w-64 space-y-2">
            <div v-if="isConnected" class="mb-2">
                <div class="badge badge-success">Подключено</div>
                <div class="text-xs mt-1">
                    Участников: {{ participantLocations.length + 1 }}
                </div>
            </div>
            <div></div>
            <ul v-if="!meetingLink" class="ml-6 text-m font-medium list-decimal">
                <li v-for="item in MAP_CONSTANTS.LIST_ITEMS" :key="item.id"
                    :class="meetStep === item.step ? 'list-item' : 'list-item opacity-10'">
                    {{ item.name }}
                </li>
            </ul>
            <div v-if="meetStep === MapsTypes.uiStep.CREATE_MEETING_LINK">
                <button type="button" class="btn btn-primary w-full" @click="createMeetingLink"
                    :disabled="createMeetingMutation.isPending">
                    <span v-if="createMeetingMutation.isPending" class="loading loading-spinner"></span>
                    {{ createMeetingMutation.isPending ? 'Создание...' : 'Создать встречу' }}
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
