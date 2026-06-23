import { gqlFetch } from '~/lib/graphql-client'
import type { Notification, NotificationCategory, NotificationPreferences } from '~/types/notification'

const NOTIFICATION_FRAGMENT = `id userId type title body isRead metadata createdAt`
const PREFERENCES_FRAGMENT = `userId projectUpdates messages payments system updatedAt`

const MY_NOTIFICATIONS = `
  query MyNotifications($unreadOnly: Boolean, $limit: Int, $offset: Int) {
    myNotifications(unreadOnly: $unreadOnly, limit: $limit, offset: $offset) { ${NOTIFICATION_FRAGMENT} }
  }
`
const UNREAD_COUNT = `query UnreadCount { unreadCount }`
const MARK_AS_READ = `mutation MarkAsRead($id: ID!) { markAsRead(id: $id) { ${NOTIFICATION_FRAGMENT} } }`
const MARK_ALL_AS_READ = `mutation MarkAllAsRead { markAllAsRead }`
const DELETE_NOTIFICATION = `mutation DeleteNotification($id: ID!) { deleteNotification(id: $id) }`
const MY_PREFERENCES = `query MyNotificationPreferences { myNotificationPreferences { ${PREFERENCES_FRAGMENT} } }`
const UPDATE_PREFERENCES = `
  mutation UpdateNotificationPreferences($input: UpdateNotificationPreferencesInput!) {
    updateNotificationPreferences(input: $input) { ${PREFERENCES_FRAGMENT} }
  }
`

interface ListOptions {
  unreadOnly?: boolean
  limit?: number
  offset?: number
}

export const notificationsApi = {
  list: (opts: ListOptions = {}) =>
    gqlFetch<{ myNotifications: Notification[] }>(MY_NOTIFICATIONS, {
      unreadOnly: opts.unreadOnly ?? false,
      limit: opts.limit ?? 30,
      offset: opts.offset ?? 0,
    }).then((r) => r.myNotifications),

  unreadCount: () => gqlFetch<{ unreadCount: number }>(UNREAD_COUNT).then((r) => r.unreadCount),

  markAsRead: (id: string) =>
    gqlFetch<{ markAsRead: Notification }>(MARK_AS_READ, { id }).then((r) => r.markAsRead),

  markAllAsRead: () => gqlFetch<{ markAllAsRead: number }>(MARK_ALL_AS_READ).then((r) => r.markAllAsRead),

  remove: (id: string) =>
    gqlFetch<{ deleteNotification: boolean }>(DELETE_NOTIFICATION, { id }).then(
      (r) => r.deleteNotification,
    ),

  getPreferences: () =>
    gqlFetch<{ myNotificationPreferences: NotificationPreferences }>(MY_PREFERENCES).then(
      (r) => r.myNotificationPreferences,
    ),

  updatePreferences: (input: Partial<Record<NotificationCategory, boolean>>) =>
    gqlFetch<{ updateNotificationPreferences: NotificationPreferences }>(UPDATE_PREFERENCES, {
      input,
    }).then((r) => r.updateNotificationPreferences),
}

/** Parse the JSON `metadata` string into an object (empty if absent/invalid). */
export function parseNotificationMetadata(metadata: string | null): Record<string, unknown> {
  if (!metadata) return {}
  try {
    const parsed = JSON.parse(metadata)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/** In-app route a notification opens on click, or null if not linkable. */
export function notificationRoute(notification: Notification): string | null {
  const link = parseNotificationMetadata(notification.metadata).deepLink
  return typeof link === 'string' && link.startsWith('/') ? link : null
}

/** Feather icon keyed by notification `type`. */
export function notificationIcon(type: string): string {
  switch (type) {
    case 'project':
    case 'application':
      return 'briefcase'
    case 'message':
    case 'chat':
      return 'message-circle'
    case 'payment':
    case 'escrow':
      return 'credit-card'
    case 'submission':
    case 'review':
      return 'file-text'
    case 'rating':
      return 'star'
    case 'dispute':
      return 'alert-triangle'
    case 'verification':
      return 'shield'
    default:
      return 'bell'
  }
}
