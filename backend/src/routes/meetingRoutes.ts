import express from 'express';
import {
    createMeeting,
    getMeetingByLink,
    joinMeeting,
    getUserMeetings
} from '../controllers/meetingController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', protect, createMeeting);
router.get('/link/:link', protect, getMeetingByLink);
router.post('/join', protect, joinMeeting);
router.get('/my-meetings', protect, getUserMeetings);

export default router;

