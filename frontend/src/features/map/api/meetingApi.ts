import axios from 'axios';
import { HOST } from '@/features/auth/api/constants';

const api = axios.create({
    baseURL: `${HOST}/api/meetings`,
});

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface CreateMeetingData {
    title: string;
    description?: string;
    location: {
        coordinates: [number, number];
        address?: string;
    };
    meetingDate?: Date;
}

export interface Meeting {
    _id: string;
    title: string;
    description?: string;
    location: {
        coordinates: [number, number];
        address?: string;
    };
    creator: {
        _id: string;
        name: string;
        email: string;
    };
    participants: Array<{
        _id: string;
        name: string;
        email: string;
    }>;
    participantLocations: Array<{
        userId: {
            _id: string;
            name: string;
            email: string;
        };
        coordinates: [number, number];
        lastUpdate: string;
    }>;
    meetingLink: string;
    meetingDate?: string;
    status: 'active' | 'completed' | 'cancelled';
    createdAt: string;
    updatedAt: string;
}

export const meetingApi = {
    createMeeting: async (data: CreateMeetingData) => {
        const response = await api.post<Meeting>('/', data);
        return response.data;
    },

    getMeetingByLink: async (link: string) => {
        const response = await api.get<Meeting>(`/link/${link}`);
        return response.data;
    },

    joinMeeting: async (meetingId: string) => {
        const response = await api.post<Meeting>('/join', { meetingId });
        return response.data;
    },

    getUserMeetings: async () => {
        const response = await api.get<Meeting[]>('/my-meetings');
        return response.data;
    },
};

