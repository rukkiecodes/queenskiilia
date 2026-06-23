<script setup lang="ts">
import ChatBubble from '~/components/chat/chat-bubble.vue'
import ChatInput from '~/components/chat/chat-input.vue'
import { useChatRoom } from '~/composables/use-chat-room'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'app' })

const route = useRoute()
const chatId = computed(() => route.params.chatId as string)
const auth = useAuthStore()

const { messages, isPending, typingPeer, send, emitTyping } = useChatRoom(() => chatId.value)
</script>

<template>
  <div class="cr">
    <header class="cr__head">
      <f-btn variant="text" icon="arrow-left" aria-label="Back" @click="navigateTo('/chat')" />
      <span class="cr__title">Conversation</span>
    </header>

    <ClientOnly>
      <div class="cr__messages">
        <ChatBubble
          v-for="m in messages"
          :key="m.id"
          :message="m"
          :mine="m.senderId === auth.user?.id"
        />
        <p v-if="!messages.length && !isPending" class="cr__empty">No messages yet — say hello 👋</p>
      </div>
      <p v-if="typingPeer" class="cr__typing">typing…</p>

      <template #fallback>
        <div class="cr__messages"><p class="cr__empty">Loading…</p></div>
      </template>
    </ClientOnly>

    <ChatInput @send="send" @typing="emitTyping" />
  </div>
</template>

<style scoped>
.cr {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 120px);
  max-width: 820px;
  margin: 0 auto;
}
.cr__head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(var(--fui-theme-on-background), 0.1);
}
.cr__title {
  font-weight: 600;
}
.cr__messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column-reverse;
  padding: 12px 4px;
}
.cr__empty {
  margin: auto;
  opacity: 0.5;
}
.cr__typing {
  margin: 0;
  padding: 2px 8px;
  font-size: 0.8rem;
  opacity: 0.6;
  font-style: italic;
}
</style>
