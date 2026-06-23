import { useAuthStore } from '~/stores/auth'
import { useNotificationsStore } from '~/stores/notifications'
import { useUiStore } from '~/stores/ui'

/**
 * Manages the Socket.IO connection lifecycle: connect once a session token is in
 * memory, disconnect when it clears, and recover from an auth-related connect
 * error by refreshing the token and reconnecting once.
 *
 * Dev-only logging of notification:new / message:new is wired here for visibility;
 * Feature 13 replaces it with real store updates.
 */
export default defineNuxtPlugin(() => {
  const auth = useAuthStore()
  const { connect, disconnect, getSocket } = useSocket()

  // Connect/disconnect following the access token.
  watch(
    () => auth.accessToken,
    (token) => {
      if (token) connect()
      else disconnect()
    },
    { immediate: true },
  )

  const socket = getSocket()
  if (!socket) return

  // Recover from an expired-token handshake: refresh once, then reconnect.
  let recovering = false
  socket.on('connect_error', async (err) => {
    if (recovering) return
    if (!/auth|token|expired/i.test(err.message)) return
    recovering = true
    try {
      const token = await auth.refresh()
      if (token) connect()
    } finally {
      recovering = false
    }
  })

  // Live notifications → bump the bell + surface a toast.
  socket.on('notification:new', (n: { title?: string; body?: string } = {}) => {
    useNotificationsStore().increment()
    useUiStore().info({ title: n.title ?? 'Notification', text: n.body })
  })

  if (import.meta.dev) {
    socket.on('message:new', (m) => console.log('[socket] message:new', m))
  }
})
