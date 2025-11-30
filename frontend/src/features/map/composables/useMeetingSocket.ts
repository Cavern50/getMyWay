import { ref, onUnmounted, type Ref } from 'vue';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import type { Meeting } from '../api/meetingApi';

const HOST = import.meta.env.VITE_API_HOST || 'http://localhost:3000';

export interface ParticipantLocation {
    userId: string;
    coordinates: [number, number];
    participantLocations: Array<{
        userId: {
            _id: string;
            name: string;
        };
        coordinates: [number, number];
        lastUpdate: string;
    }>;
}

export function useMeetingSocket() {
    const socket: Ref<Socket | null> = ref(null);
    const isConnected = ref(false);
    const currentMeeting: Ref<Meeting | null> = ref(null);
    const participantLocations = ref<ParticipantLocation['participantLocations']>([]);

    const authStore = useAuthStore();

    function connect() {
        if (socket.value?.connected) {
            return;
        }

        const token = authStore.token;
        if (!token) {
            console.error('No token available for socket connection');
            return;
        }

        socket.value = io(HOST, {
            auth: {
                token,
            },
            transports: ['websocket', 'polling'],
        });

        socket.value.on('connect', () => {
            console.log('Socket connected');
            isConnected.value = true;
        });

        socket.value.on('disconnect', () => {
            console.log('Socket disconnected');
            isConnected.value = false;
        });

        socket.value.on('error', (error: { message: string }) => {
            console.error('Socket error:', error);
        });

        socket.value.on('meeting-joined', (data: { meeting: Meeting; participantLocations: ParticipantLocation['participantLocations'] }) => {
            currentMeeting.value = data.meeting;
            participantLocations.value = data.participantLocations;
        });

        socket.value.on('participant-joined', (data: { userId: string; meeting: Meeting }) => {
            currentMeeting.value = data.meeting;
        });

        socket.value.on('participant-location-updated', (data: ParticipantLocation) => {
            participantLocations.value = data.participantLocations;
        });

        socket.value.on('participant-left', (data: { userId: string }) => {
            console.log('Participant left:', data);
            // Удаляем позицию участника из списка
            participantLocations.value = participantLocations.value.filter(
                (loc) => loc.userId._id !== data.userId
            );
        });
    }

    function disconnect() {
        if (socket.value) {
            socket.value.disconnect();
            socket.value = null;
            isConnected.value = false;
            currentMeeting.value = null;
            participantLocations.value = [];
        }
    }

    function joinMeeting(meetingLink: string) {
        if (!socket.value || !socket.value.connected) {
            connect();
            // Ждем подключения перед отправкой события
            socket.value!.on('connect', () => {
                socket.value?.emit('join-meeting', { meetingLink });
            });
        } else {
            socket.value.emit('join-meeting', { meetingLink });
        }
    }

    function updateLocation(_meetingId: string, coordinates: [number, number]) {
        // Если сокет не подключен, пытаемся подключиться
        if (!socket.value || !socket.value.connected) {
            // Если сокета нет, создаем его
            if (!socket.value) {
                connect();
            }

            // После connect() socket.value должен быть установлен
            // Подписываемся на событие подключения, если еще не подключен
            if (socket.value && !socket.value.connected) {
                socket.value.once('connect', () => {
                    if (currentMeeting.value) {
                        socket.value?.emit('update-location', { coordinates });
                    }
                });
            } else if (socket.value?.connected && currentMeeting.value) {
                // Если уже подключен после connect(), отправляем сразу
                socket.value.emit('update-location', { coordinates });
            }
            return;
        }

        // Если сокет подключен и есть текущая встреча, отправляем обновление
        if (currentMeeting.value) {
            socket.value.emit('update-location', { coordinates });
        }
    }

    function leaveMeeting(meetingId: string) {
        if (socket.value?.connected) {
            socket.value.emit('leave-meeting', { meetingId });
        }
    }

    onUnmounted(() => {
        disconnect();
    });

    return {
        socket,
        isConnected,
        currentMeeting,
        participantLocations,
        connect,
        disconnect,
        joinMeeting,
        updateLocation,
        leaveMeeting,
    };
}

