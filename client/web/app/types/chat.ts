/** Mirrors the chat-service `Message` type, plus client-only optimistic flags. */
export interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  content: string | null
  attachmentUrls: string[]
  isRead: boolean
  sentAt: string
  /** Client-only: true while an optimistic message is in flight. */
  pending?: boolean
  /** Client-only: true if an optimistic send failed. */
  failed?: boolean
}

export interface Chat {
  id: string
  projectId: string
  studentId: string
  businessId: string
  createdAt: string
  lastMessage: ChatMessage | null
  unreadCount: number
}

export interface SendMessageInput {
  chatId: string
  content?: string
  attachmentUrls?: string[]
}
