import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes';
import meetingRoutes from './routes/meetingRoutes';
import { setupMeetingSocket } from './socket/meetingSocket';
import cors from 'cors';

dotenv.config();
const app = express();

// Создаем HTTP сервер для Socket.IO
const httpServer = createServer(app);

// Настраиваем Socket.IO с CORS
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: 'http://localhost:5173', // адрес твоего фронтенда
  credentials: true,               // если используешь куки
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error(err));

// Настраиваем Socket.IO обработчики
setupMeetingSocket(io);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

export { io };
