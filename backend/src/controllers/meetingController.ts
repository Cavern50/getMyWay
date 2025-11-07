import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { MeetingService } from '../services/meetingService';
import { randomUUID } from 'crypto';

export const createMeeting = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, location, meetingDate } = req.body;

        if (!location?.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
            return res.status(400).json({ message: 'Invalid location coordinates' });
        }

        // Генерируем уникальную ссылку на встречу
        const meetingLink = `meet-${randomUUID()}`;

        const meeting = await MeetingService.createMeeting({
            title,
            description,
            location: {
                coordinates: location.coordinates,
                address: location.address
            },
            creator: req.user!.id,
            meetingLink,
            meetingDate: meetingDate ? new Date(meetingDate) : undefined
        });

        res.status(201).json(meeting);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getMeetingByLink = async (req: AuthRequest, res: Response) => {
    try {
        const { link } = req.params;
        const meeting = await MeetingService.findByLink(link);

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        res.json(meeting);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const joinMeeting = async (req: AuthRequest, res: Response) => {
    try {
        const { meetingId, meetingLink } = req.body;

        if (meetingLink) {
            // Если передан meetingLink, сначала находим встречу
            const meeting = await MeetingService.findByLink(meetingLink);
            if (!meeting) {
                return res.status(404).json({ message: 'Meeting not found' });
            }
            const updatedMeeting = await MeetingService.addParticipant(meeting._id.toString(), req.user!.id);
            return res.json(updatedMeeting);
        } else if (meetingId) {
            const meeting = await MeetingService.addParticipant(meetingId, req.user!.id);
            return res.json(meeting);
        } else {
            return res.status(400).json({ message: 'meetingId or meetingLink required' });
        }
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getUserMeetings = async (req: AuthRequest, res: Response) => {
    try {
        const meetings = await MeetingService.getUserMeetings(req.user!.id);
        res.json(meetings);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

