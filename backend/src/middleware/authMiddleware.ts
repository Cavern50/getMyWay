import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ExtendedSocket } from '../types/socket';

export interface AuthRequest extends Request {
    user?: {
        id: string;
    };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        req.user = { id: decoded.id };
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

export const authenticateSocket = (socket: ExtendedSocket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
        return next(new Error('Authentication error: No token provided'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        socket.userId = decoded.id;
        next();
    } catch (error) {
        next(new Error('Authentication error: Invalid token'));
    }
};

