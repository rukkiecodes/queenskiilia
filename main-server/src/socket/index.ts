import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { verifyAccessToken } from '../auth/jwt';
import { env } from '../config/env';
import { registerRoomHandlers } from './rooms';
import { emitTelemetry } from '../telemetry';

let io: SocketIOServer;

export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Recommended for load-balanced environments (Phase 2: add Redis adapter)
    transports: ['websocket', 'polling'],
  });

  // Auth middleware — every connecting socket must supply a valid JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      socket.data.accountType = payload.accountType;
      socket.data.isVerified = payload.isVerified;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    console.log(`[Socket.IO] Connected: ${userId} (${socket.id})`);

    emitTelemetry({
      operationType: 'socket',
      operationName: 'socket:connect',
      userId,
      durationMs: 0,
      status: 'success',
    }).catch(() => {});

    registerRoomHandlers(socket);
  });

  console.log('[Socket.IO] Server initialised');
  return io;
}

// Used by the internal /internal/emit endpoint to push events from microservices
export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.IO not initialised');
  return io;
}
