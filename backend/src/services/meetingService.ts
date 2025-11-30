import Meeting from '../models/Meeting';
import { Types } from 'mongoose';

export interface ParticipantLocation {
    userId: Types.ObjectId;
    coordinates: [number, number];
    lastUpdate: Date;
}

export class MeetingService {
    /**
     * Создать новую встречу
     */
    static async createMeeting(data: {
        title: string;
        description?: string;
        location: { coordinates: [number, number]; address?: string };
        creator: string;
        meetingLink: string;
        meetingDate?: Date;
    }) {
        const meeting = await Meeting.create({
            ...data,
            creator: new Types.ObjectId(data.creator),
            participants: [new Types.ObjectId(data.creator)],
            participantLocations: []
        });
        return meeting.populate('creator', 'name email');
    }

    /**
     * Найти встречу по ссылке
     */
    static async findByLink(meetingLink: string) {
        return Meeting.findOne({ meetingLink })
            .populate('creator', 'name email')
            .populate('participants', 'name email')
            .populate('participantLocations.userId', 'name email');
    }

    /**
     * Добавить участника к встрече
     */
    static async addParticipant(meetingId: string, userId: string) {
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) throw new Error('Meeting not found');

        const userObjectId = new Types.ObjectId(userId);

        if (!meeting.participants.some(p => p.toString() === userId)) {
            meeting.participants.push(userObjectId);
            await meeting.save();
        }

        return meeting.populate(['creator', 'participants']);
    }

    /**
     * Обновить позицию участника
     */
    static async updateParticipantLocation(
        meetingId: string,
        userId: string,
        coordinates: [number, number]
    ) {
        console.log('INSIDE')
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) throw new Error('Meeting not found');

        const userObjectId = new Types.ObjectId(userId);

        // Находим существующую позицию или создаем новую
        const existingIndex = meeting.participantLocations.findIndex(
            loc => loc.userId.toString() === userId
        );

        const locationData: ParticipantLocation = {
            userId: userObjectId,
            coordinates,
            lastUpdate: new Date()
        };

        if (existingIndex >= 0) {
            meeting.participantLocations[existingIndex] = locationData;
        } else {
            meeting.participantLocations.push(locationData);
        }

        await meeting.save();
        return meeting.populate(['creator', 'participants', 'participantLocations.userId']);
    }

    /**
     * Получить все встречи пользователя
     */
    static async getUserMeetings(userId: string) {
        return Meeting.find({
            $or: [
                { creator: userId },
                { participants: userId }
            ],
            status: 'active'
        })
            .populate('creator', 'name email')
            .populate('participants', 'name email')
            .sort({ createdAt: -1 });
    }

    /**
     * Удалить участника из встречи
     */
    static async removeParticipant(meetingId: string, userId: string) {
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) throw new Error('Meeting not found');

        meeting.participants = meeting.participants.filter(
            p => p.toString() !== userId
        );

        meeting.participantLocations = meeting.participantLocations.filter(
            loc => loc.userId.toString() !== userId
        );

        await meeting.save();
        return meeting;
    }
}

