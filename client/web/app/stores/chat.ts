import { defineStore } from 'pinia'
import type { ChatMessage } from '~/types/chat'

/**
 * In-flight + live chat messages indexed by chatId (newest first), supporting
 * optimistic send. Mirrors client/mobile/store/chat-store.ts; the de-dupe guards
 * matter because Socket.IO can echo a message we already inserted optimistically.
 */
export const useChatStore = defineStore('chat', () => {
  const byChat = ref<Record<string, ChatMessage[]>>({})

  function setMessages(chatId: string, messages: ChatMessage[]) {
    byChat.value[chatId] = messages
  }

  function prependMessage(chatId: string, message: ChatMessage) {
    const existing = byChat.value[chatId] ?? []
    if (existing.some((m) => m.id === message.id)) return
    byChat.value[chatId] = [message, ...existing]
  }

  /** Replace an optimistic message (matched by tempId) with the server's row. */
  function replaceMessage(chatId: string, tempId: string, real: ChatMessage) {
    const existing = byChat.value[chatId] ?? []
    if (existing.some((m) => m.id === real.id)) {
      // Real already arrived live; just drop the temp.
      byChat.value[chatId] = existing.filter((m) => m.id !== tempId)
    } else {
      byChat.value[chatId] = existing.map((m) => (m.id === tempId ? real : m))
    }
  }

  function removeMessage(chatId: string, id: string) {
    byChat.value[chatId] = (byChat.value[chatId] ?? []).filter((m) => m.id !== id)
  }

  function patchMessage(chatId: string, id: string, patch: Partial<ChatMessage>) {
    byChat.value[chatId] = (byChat.value[chatId] ?? []).map((m) =>
      m.id === id ? { ...m, ...patch } : m,
    )
  }

  function clear(chatId: string) {
    const { [chatId]: _drop, ...rest } = byChat.value
    byChat.value = rest
  }

  return {
    byChat,
    setMessages,
    prependMessage,
    replaceMessage,
    removeMessage,
    patchMessage,
    clear,
  }
})
