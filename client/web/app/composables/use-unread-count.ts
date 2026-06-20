import { useAuthStore } from '~/stores/auth'
import { useNotificationsStore } from '~/stores/notifications'
import { notificationsApi } from '~/lib/notifications-api'

/**
 * Refreshes the unread-notification count into the store. Feature 13 adds the
 * live Socket.IO `notification:new` updates on top of this.
 */
export function useUnreadCount() {
  const auth = useAuthStore()
  const store = useNotificationsStore()

  async function refresh() {
    if (!auth.isAuthenticated) return
    try {
      store.setUnreadCount(await notificationsApi.unreadCount())
    } catch {
      // Cold gateway / not authed yet — leave the count untouched.
    }
  }

  return { refresh }
}
