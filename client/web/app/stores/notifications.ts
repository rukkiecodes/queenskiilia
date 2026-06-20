import { defineStore } from 'pinia'

/**
 * Unread-notification count for the navbar bell badge. Kept in sync with the
 * server by the notifications composable (polling + Socket.IO `notification:new`);
 * the bell only reads. Mirrors client/mobile/store/notification-store.ts.
 */
export const useNotificationsStore = defineStore('notifications', () => {
  const unreadCount = ref(0)

  function setUnreadCount(n: number) {
    unreadCount.value = Math.max(0, n)
  }
  function increment(by = 1) {
    unreadCount.value = Math.max(0, unreadCount.value + by)
  }
  function decrement(by = 1) {
    unreadCount.value = Math.max(0, unreadCount.value - by)
  }
  function reset() {
    unreadCount.value = 0
  }

  return { unreadCount, setUnreadCount, increment, decrement, reset }
})
