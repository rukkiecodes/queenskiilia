import { useQuery, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { chatApi } from '~/lib/chat-api'
import { useChatStore } from '~/stores/chat'
import { useAuthStore } from '~/stores/auth'
import { useSocket } from '~/composables/use-socket'
import type { ChatMessage } from '~/types/chat'

/**
 * A single chat thread: message history (DESC, newest first) merged with live
 * Socket.IO `message:new` events, optimistic send, typing indicators, and read
 * receipts. The store de-dupes so a server echo of an optimistic message is safe.
 */
export function useChatRoom(chatId: MaybeRefOrGetter<string>) {
  const id = computed(() => toValue(chatId))
  const chatStore = useChatStore()
  const auth = useAuthStore()
  const qc = useQueryClient()
  const { joinChat, leaveChat, on, sendTyping } = useSocket()

  const { data: history, isPending } = useQuery({
    queryKey: ['chatMessages', id],
    queryFn: () => chatApi.messages(toValue(chatId)),
  })

  // Seed the store from fetched history (store is the reactive source of truth).
  watch(
    history,
    (msgs) => {
      if (msgs) chatStore.setMessages(id.value, [...msgs])
    },
    { immediate: true },
  )

  const messages = computed<ChatMessage[]>(() => chatStore.byChat[id.value] ?? [])

  const typingPeer = ref(false)
  let typingTimer: ReturnType<typeof setTimeout> | undefined
  let offMessage: (() => void) | undefined
  let offTyping: (() => void) | undefined

  function markRead() {
    chatApi
      .markRead(id.value)
      .then(() => qc.invalidateQueries({ queryKey: ['myChats'] }))
      .catch(() => {})
  }

  onMounted(() => {
    joinChat(id.value)
    markRead()

    offMessage = on<ChatMessage>('message:new', (m) => {
      if (m.chatId !== id.value) return
      chatStore.prependMessage(id.value, m)
      if (m.senderId !== auth.user?.id) markRead()
    })

    offTyping = on<{ userId: string; isTyping: boolean }>('chat:typing', ({ userId, isTyping }) => {
      if (userId === auth.user?.id) return
      typingPeer.value = isTyping
      if (isTyping) {
        clearTimeout(typingTimer)
        typingTimer = setTimeout(() => (typingPeer.value = false), 3000)
      }
    })
  })

  onUnmounted(() => {
    offMessage?.()
    offTyping?.()
    leaveChat(id.value)
    clearTimeout(typingTimer)
  })

  async function send(content: string, attachmentUrls: string[] = []) {
    const text = content.trim()
    if (!text && attachmentUrls.length === 0) return

    const tempId = `temp-${Date.now()}-${Math.round(Math.random() * 1e6)}`
    chatStore.prependMessage(id.value, {
      id: tempId,
      chatId: id.value,
      senderId: auth.user?.id ?? 'me',
      content: text || null,
      attachmentUrls,
      isRead: false,
      sentAt: new Date().toISOString(),
      pending: true,
    })

    try {
      const real = await chatApi.send({
        chatId: id.value,
        content: text || undefined,
        attachmentUrls: attachmentUrls.length ? attachmentUrls : undefined,
      })
      chatStore.replaceMessage(id.value, tempId, real)
      qc.invalidateQueries({ queryKey: ['myChats'] })
    } catch {
      chatStore.patchMessage(id.value, tempId, { pending: false, failed: true })
    }
  }

  function emitTyping(isTyping: boolean) {
    sendTyping(id.value, isTyping)
  }

  return { messages, isPending, typingPeer, send, emitTyping }
}
