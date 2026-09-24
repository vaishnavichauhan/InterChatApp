import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

let socketInstance: Socket | null = null;
let currentSocketUserId: number | string | null = null;

export const getSocket = (userId?: number | string | null): Socket => {
  if (socketInstance) {
    if (userId && currentSocketUserId && currentSocketUserId !== userId) {
      socketInstance.disconnect();
      socketInstance = null;
    } else {
      if (userId && socketInstance.connected) {
        socketInstance.emit('user:online', userId);
      }
      return socketInstance;
    }
  }

  currentSocketUserId = userId || null;

  socketInstance = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 10000,
    query: userId ? { userId: String(userId) } : undefined,
    auth: userId ? { userId: String(userId) } : undefined,
  });

  socketInstance.on('connect', () => {
    console.log('⚡ Connected to InterChat Socket server:', socketInstance?.id);
    if (userId) {
      socketInstance?.emit('user:online', userId);
    }
  });

  socketInstance.on('disconnect', (reason) => {
    console.log('🔌 Disconnected from InterChat Socket server:', reason);
  });

  socketInstance.on('connect_error', (err) => {
    console.warn('Socket connection error:', err.message);
  });

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    currentSocketUserId = null;
  }
};
