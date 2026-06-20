export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  body: string
  isRead: boolean
  /** JSON string; parse with parseNotificationMetadata (carries `deepLink`). */
  metadata: string | null
  createdAt: string
}

export interface NotificationPreferences {
  userId: string
  projectUpdates: boolean
  messages: boolean
  payments: boolean
  system: boolean
  updatedAt: string
}

export type NotificationCategory = 'projectUpdates' | 'messages' | 'payments' | 'system'
