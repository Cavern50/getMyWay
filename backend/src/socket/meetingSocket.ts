import { Server } from 'socket.io';
import { ExtendedSocket } from '../types/socket';
import { MeetingService } from '../services/meetingService';
import { authenticateSocket } from '../middleware/authMiddleware';

export function setupMeetingSocket(io: Server) {
    // Middleware для аутентификации
    io.use(authenticateSocket);

    io.on('connection', (socket: ExtendedSocket) => {
        console.log(`User ${socket.userId} connected`);

        // Присоединение к встрече
        socket.on('join-meeting', async (data: { meetingLink: string }) => {
            try {
                const { meetingLink } = data;

                if (!socket.userId) {
                    socket.emit('error', { message: 'User not authenticated' });
                    return;
                }

                // Находим встречу по ссылке
                const meeting = await MeetingService.findByLink(meetingLink);
                if (!meeting) {
                    socket.emit('error', { message: 'Meeting not found' });
                    return;
                }

                // Добавляем участника к встрече
                await MeetingService.addParticipant(meeting._id.toString(), socket.userId);

                // Обновляем встречу после добавления участника
                const updatedMeeting = await MeetingService.findByLink(meetingLink);

                // Присоединяемся к комнате встречи
                socket.join(`meeting:${meeting._id}`);
                socket.meetingId = meeting._id.toString();

                // Отправляем текущее состояние встречи
                if (updatedMeeting) {
                    socket.emit('meeting-joined', {
                        meeting: updatedMeeting,
                        participantLocations: updatedMeeting.participantLocations
                    });

                    // Уведомляем других участников
                    socket.to(`meeting:${meeting._id}`).emit('participant-joined', {
                        userId: socket.userId,
                        meeting: updatedMeeting
                    });
                }
            } catch (error: any) {
                socket.emit('error', { message: error.message });
                console.log(error, 'error');
            }
        });

        // Обновление позиции участника
        socket.on('update-location', async (data: { coordinates: [number, number] }) => {
            try {
                const { coordinates } = data;
                console.log(coordinates, 'UPDATE LOCATION WAS TRIED')
                if (!socket.userId || !socket.meetingId) {
                    socket.emit('error', { message: 'User not authenticated or not in meeting' });
                    return;
                }

                // Обновляем позицию в базе данных
                const meeting = await MeetingService.updateParticipantLocation(
                    socket.meetingId,
                    socket.userId,
                    coordinates
                );

                // Отправляем обновление всем участникам встречи (включая отправителя для подтверждения)
                io.to(`meeting:${socket.meetingId}`).emit('participant-location-updated', {
                    userId: socket.userId,
                    coordinates,
                    participantLocations: meeting.participantLocations
                });
            } catch (error: any) {
                console.log('UPDATE LOCATION WAS TRIED')
                socket.emit('error', { message: error.message });
            }
        });

        // Выход из встречи
        socket.on('leave-meeting', async (data: { meetingId: string }) => {
            try {
                const { meetingId } = data;

                if (socket.userId) {
                    await MeetingService.removeParticipant(meetingId, socket.userId);

                    socket.to(`meeting:${meetingId}`).emit('participant-left', {
                        userId: socket.userId
                    });
                }

                socket.leave(`meeting:${meetingId}`);
                socket.meetingId = undefined;
            } catch (error: any) {
                socket.emit('error', { message: error.message });
            }
        });

        // Отключение
        socket.on('disconnect', async () => {
            if (socket.meetingId && socket.userId) {
                try {
                    await MeetingService.removeParticipant(socket.meetingId, socket.userId);
                    socket.to(`meeting:${socket.meetingId}`).emit('participant-left', {
                        userId: socket.userId
                    });
                } catch (error) {
                    console.error('Error removing participant on disconnect:', error);
                }
            }
            console.log(`User ${socket.userId} disconnected`);
        });
    });
}

