import type { Socket } from 'socket.io';
import { emitTelemetry } from '../telemetry';

// Room name helpers — consistent naming across the codebase
export const Rooms = {
  user: (userId: string) => `user:${userId}`,
  project: (projectId: string) => `project:${projectId}`,
  chat: (chatId: string) => `chat:${chatId}`,
};

export function registerRoomHandlers(socket: Socket): void {
  const userId = socket.data.userId as string;

  // Auto-join personal notification room on connect
  socket.join(Rooms.user(userId));

  // Client requests to follow a project's real-time updates
  socket.on('join-project', (projectId: string) => {
    if (typeof projectId !== 'string') return;
    socket.join(Rooms.project(projectId));
  });

  socket.on('leave-project', (projectId: string) => {
    if (typeof projectId !== 'string') return;
    socket.leave(Rooms.project(projectId));
  });

  // Client opens a chat thread
  socket.on('join-chat', (chatId: string) => {
    if (typeof chatId !== 'string') return;
    socket.join(Rooms.chat(chatId));
  });

  socket.on('leave-chat', (chatId: string) => {
    if (typeof chatId !== 'string') return;
    socket.leave(Rooms.chat(chatId));
  });

  // Typing indicator — relay directly, no DB write
  socket.on('chat:typing', ({ chatId, isTyping }: { chatId: string; isTyping: boolean }) => {
    if (typeof chatId !== 'string') return;
    socket.to(Rooms.chat(chatId)).emit('chat:typing', {
      userId,
      isTyping,
    });
  });

  socket.on('disconnect', () => {
    emitTelemetry({
      operationType: 'socket',
      operationName: 'socket:disconnect',
      userId,
      durationMs: 0,
      status: 'success',
    }).catch(() => {});
  });
}
