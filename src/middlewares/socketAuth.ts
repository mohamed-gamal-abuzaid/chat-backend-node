import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

export interface AuthenticatedSocket extends Socket {
  user?: { id: number; email: string };
}

export const socketAuthMiddleware = (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }

  if (token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;

   
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return next(new Error('Authentication error: Invalid token payload'));
    }

    socket.user = { id: userId, email: decoded.email };
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid or expired token'));
  }
};