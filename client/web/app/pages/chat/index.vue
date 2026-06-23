<script setup lang="ts">
import ChatPreviewCard from '~/components/cards/chat-preview-card.vue'
import { useMyChats } from '~/composables/use-my-chats'

definePageMeta({ layout: 'app' })

const { data: chats, isPending, suspense } = useMyChats()
onServerPrefetch(() => suspense().catch(() => {}))
</script>

<template>
  <div class="chl">
    <h1 class="chl__title">Messages</h1>

    <p v-if="isPending" class="chl__status">Loading…</p>

    <div v-else-if="chats && chats.length" class="chl__list">
      <ChatPreviewCard v-for="c in chats" :key="c.id" :chat="c" />
    </div>

    <EmptyState
      v-else
      icon="message-circle"
      title="No conversations yet"
      text="A chat opens automatically once you're working together on a project."
    />
  </div>
</template>

<style scoped>
.chl {
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.chl__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.chl__list {
  display: flex;
  flex-direction: column;
}
.chl__status {
  opacity: 0.6;
}
</style>
