import { Server } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';

interface SocketServer extends HTTPServer {
  io?: Server;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

// Track socket ID to user ID mapping
const socketToUser = new Map<string, string>();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const response = res as NextApiResponseWithSocket;
  
  if (!response.socket?.server) {
    res.status(500).json({ error: 'Server not initialized' });
    return;
  }

  const server = response.socket.server;

  if (!server.io) {
    console.log('Initializing Socket.IO server...');
    
    const io = new Server(server, {
      path: '/api/webrtc-signaling',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'
          : '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    server.io = io;

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      socket.on('join-room', (payload: { roomId: string; userId: string }) => {
        try {
          const { roomId, userId } = payload;

          if (!roomId || !userId) {
            socket.emit('error', { message: 'roomId and userId are required' });
            return;
          }

          // Store socket-to-user mapping
          socketToUser.set(socket.id, userId);

          socket.join(roomId);
          console.log(`User ${userId} joined room ${roomId}`);

          // Notify others in the room
          socket.to(roomId).emit('user-joined', { userId, socketId: socket.id });

          // Get existing users in room to send to new user
          const room = io.sockets.adapter.rooms.get(roomId);
          const existingUsers: Array<{socketId: string, userId: string}> = [];
          if (room) {
            room.forEach(sid => {
              if (sid !== socket.id) {
                const uid = socketToUser.get(sid);
                if (uid) existingUsers.push({ socketId: sid, userId: uid });
              }
            });
          }

          const roomSize = room ? room.size : 0;
          socket.emit('room-joined', { roomId, memberCount: roomSize, existingUsers });
        } catch (error) {
          console.error('Error joining room:', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      socket.on('signal', (payload: { roomId: string; targetSocketId: string; signal: unknown }) => {
        try {
          const { roomId, targetSocketId, signal } = payload;

          if (!roomId || !signal || !targetSocketId) {
            socket.emit('error', { message: 'Missing required signal data' });
            return;
          }

          // Send to specific socket in the room
          io.to(targetSocketId).emit('signal', {
            signal,
            senderSocketId: socket.id,
            senderUserId: socketToUser.get(socket.id)
          });
        } catch (error) {
          console.error('Error sending signal:', error);
          socket.emit('error', { message: 'Failed to send signal' });
        }
      });

      socket.on('leave-room', (payload: { roomId: string; userId: string }) => {
        try {
          const { roomId, userId } = payload;

          if (!roomId || !userId) {
            return;
          }

          socket.leave(roomId);
          console.log(`User ${userId} left room ${roomId}`);
          socket.to(roomId).emit('user-left', { userId, socketId: socket.id });

          // Clean up mapping
          socketToUser.delete(socket.id);
        } catch (error) {
          console.error('Error leaving room:', error);
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Clean up mapping
        socketToUser.delete(socket.id);
        // Socket.IO will automatically remove from all rooms
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });
  } else {
    console.log('Socket.IO server already initialized');
  }

  res.status(200).end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};