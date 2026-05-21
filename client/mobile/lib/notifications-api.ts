import { gqlFetch } from './graphql-client';

export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  /** JSON string from the backend — parse with `parseNotificationMetadata`. */
  metadata: string | null;
  createdAt: string;
};

const NOTIFICATION_FRAGMENT = `
  id
  userId
  type
  title
  body
  isRead
  metadata
  createdAt
`;

const MY_NOTIFICATIONS = `
  query MyNotifications($unreadOnly: Boolean, $limit: Int, $offset: Int) {
    myNotifications(unreadOnly: $unreadOnly, limit: $limit, offset: $offset) {
      ${NOTIFICATION_FRAGMENT}
    }
  }
`;

const UNREAD_COUNT = `query UnreadCount { unreadCount }`;

const MARK_AS_READ = `
  mutation MarkAsRead($id: ID!) {
    markAsRead(id: $id) { ${NOTIFICATION_FRAGMENT} }
  }
`;

const MARK_ALL_AS_READ = `mutation MarkAllAsRead { markAllAsRead }`;

type ListOptions = { unreadOnly?: boolean; limit?: number; offset?: number };

export const notificationsApi = {
  list: (opts: ListOptions = {}) =>
    gqlFetch<{ myNotifications: Notification[] }>(MY_NOTIFICATIONS, {
      unreadOnly: opts.unreadOnly ?? false,
      limit: opts.limit ?? 30,
      offset: opts.offset ?? 0,
    }).then((r) => r.myNotifications),

  unreadCount: () =>
    gqlFetch<{ unreadCount: number }>(UNREAD_COUNT).then((r) => r.unreadCount),

  markAsRead: (id: string) =>
    gqlFetch<{ markAsRead: Notification }>(MARK_AS_READ, { id }).then(
      (r) => r.markAsRead,
    ),

  markAllAsRead: () =>
    gqlFetch<{ markAllAsRead: number }>(MARK_ALL_AS_READ).then(
      (r) => r.markAllAsRead,
    ),
};

/**
 * Notification `metadata` is a JSON string written by whichever service emits
 * the notification. The one field the mobile client reads is `deepLink` — an
 * in-app route the notification should open on tap. Returns an empty object if
 * metadata is absent or not valid JSON.
 */
export function parseNotificationMetadata(
  metadata: string | null,
): Record<string, unknown> {
  if (!metadata) return {};
  try {
    const parsed = JSON.parse(metadata);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** In-app route a notification opens on tap, or null if it isn't linkable. */
export function notificationRoute(notification: Notification): string | null {
  const link = parseNotificationMetadata(notification.metadata).deepLink;
  return typeof link === 'string' && link.startsWith('/') ? link : null;
}

/** SF Symbol shown in the notification card, keyed by notification `type`. */
export function notificationIcon(type: string): string {
  switch (type) {
    case 'project':
    case 'application':
      return 'briefcase';
    case 'message':
    case 'chat':
      return 'bubble.left';
    case 'payment':
    case 'escrow':
      return 'creditcard';
    case 'submission':
    case 'review':
      return 'doc.text';
    case 'rating':
      return 'star';
    case 'dispute':
      return 'exclamationmark.bubble';
    case 'verification':
      return 'checkmark.seal';
    default:
      return 'bell';
  }
}
