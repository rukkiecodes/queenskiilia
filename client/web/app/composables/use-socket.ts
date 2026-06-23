import { io, type Socket } from 'socket.io-client'
import { getAccessTokenMemory } from '~/lib/access-token'

/**
 * Singleton Socket.IO client for the main-server real-time hub.
 *
 * Strictly client-side: the handshake needs the access JWT (held in client
 * memory), and websockets have no SSR role. All helpers no-op on the server.
 *
 * Contract (main-server/src/socket):
 *  - handshake: `auth.token` = access JWT → server auto-joins `user:{id}`.
 *  - emit: join-project / leave-project / join-chat / leave-chat / chat:typing.
 *  - listen: notification:new, message:new, chat:typing, project:update.
 *
 * The `auth` callback is re-invoked on every (re)connect, so a rotated token is
 * picked up automatically after a refresh.
 */
let socket: Socket | null = null

function createSocket(url: string): Socket {
  const s = io(url, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    auth: (cb) => cb({ token: getAccessTokenMemory() ?? '' }),
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  })

  if (import.meta.dev) {
    s.on('connect', () => console.log('[socket] connected', s.id))
    s.on('disconnect', (reason) => console.log('[socket] disconnected:', reason))
    s.on('connect_error', (err) => console.warn('[socket] connect_error:', err.message))
  }

  return s
}

export function useSocket() {
  const config = useRuntimeConfig()

  function getSocket(): Socket | null {
    if (!import.meta.client) return null
    if (!socket) socket = createSocket(config.public.apiUrl)
    return socket
  }

  /** Open the connection (idempotent). Picks up the latest token via the auth cb. */
  function connect() {
    const s = getSocket()
    if (s && !s.connected) s.connect()
  }

  function disconnect() {
    socket?.disconnect()
  }

  function joinChat(chatId: string) {
    getSocket()?.emit('join-chat', chatId)
  }
  function leaveChat(chatId: string) {
    getSocket()?.emit('leave-chat', chatId)
  }
  function joinProject(projectId: string) {
    getSocket()?.emit('join-project', projectId)
  }
  function leaveProject(projectId: string) {
    getSocket()?.emit('leave-project', projectId)
  }
  function sendTyping(chatId: string, isTyping: boolean) {
    getSocket()?.emit('chat:typing', { chatId, isTyping })
  }

  /** Subscribe to a server event. Returns an unsubscribe for onUnmounted cleanup. */
  function on<T = unknown>(event: string, handler: (payload: T) => void): () => void {
    const s = getSocket()
    s?.on(event, handler as (...args: unknown[]) => void)
    return () => s?.off(event, handler as (...args: unknown[]) => void)
  }

  return {
    getSocket,
    connect,
    disconnect,
    joinChat,
    leaveChat,
    joinProject,
    leaveProject,
    sendTyping,
    on,
  }
}
