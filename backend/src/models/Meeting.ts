import mongoose, { Schema, Document } from 'mongoose';

interface IMeeting extends Document {
    title: string;
    description?: string;
    location: {
        coordinates: [number, number]; // [longitude, latitude]
        address?: string;
    };
    creator: mongoose.Types.ObjectId; // Ссылка на пользователя-создателя
    participants: mongoose.Types.ObjectId[]; // Массив участников
    participantLocations: Array<{ // Текущие позиции участников в реальном времени
        userId: mongoose.Types.ObjectId;
        coordinates: [number, number];
        lastUpdate: Date;
    }>;
    meetingLink: string; // Уникальная ссылка на встречу
    meetingDate?: Date; // Дата и время встречи (опционально)
    status: 'active' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    location: {
        coordinates: {
            type: [Number],
            required: true,
            validate: {
                validator: function (coords: number[]) {
                    return coords.length === 2 &&
                        coords[0] >= -180 && coords[0] <= 180 && // longitude
                        coords[1] >= -90 && coords[1] <= 90;     // latitude
                },
                message: 'Invalid coordinates format. Expected [longitude, latitude]'
            }
        },
        address: { type: String, trim: true }
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    participantLocations: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        coordinates: { type: [Number], required: true },
        lastUpdate: { type: Date, default: Date.now }
    }],
    meetingLink: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    meetingDate: { type: Date },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Обновление поля updatedAt при изменении документа
MeetingSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Геопространственный индекс для поиска встреч по координатам
MeetingSchema.index({ 'location.coordinates': '2dsphere' });

// Индексы для оптимизации запросов
MeetingSchema.index({ creator: 1 });
MeetingSchema.index({ status: 1 });
MeetingSchema.index({ meetingDate: 1 });

export default mongoose.model<IMeeting>('Meeting', MeetingSchema);

