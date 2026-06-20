<script setup lang="ts">
import { formatDistanceToNowStrict } from 'date-fns'
import { useAuthStore } from '~/stores/auth'
import { useUser } from '~/composables/use-user'
import type { Chat } from '~/types/chat'

const props = defineProps<{ chat: Chat }>()
const auth = useAuthStore()

const otherId = computed(() =>
  auth.user?.id === props.chat.studentId ? props.chat.businessId : props.chat.studentId,
)
const { data: other } = useUser(() => otherId.value)

const name = computed(
  () => other.value?.fullName ?? other.value?.businessProfile?.companyName ?? 'Conversation',
)
const initial = computed(() => name.value.charAt(0).toUpperCase())
const preview = computed(() => {
  const m = props.chat.lastMessage
  if (!m) return 'No messages yet'
  if (m.content) return m.content
  return m.attachmentUrls.length ? '📎 Attachment' : ''
})
const when = computed(() => {
  if (!props.chat.lastMessage) return ''
  const d = new Date(props.chat.lastMessage.sentAt)
  return Number.isNaN(d.getTime()) ? '' : formatDistanceToNowStrict(d, { addSuffix: true })
})
</script>

<template>
  <NuxtLink :to="`/chat/${chat.id}`" class="cp">
    <f-avatar :image="other?.avatarUrl ?? undefined" :text="initial" :size="48" circle />
    <div class="cp__body">
      <div class="cp__top">
        <span class="cp__name">{{ name }}</span>
        <span class="cp__when">{{ when }}</span>
      </div>
      <div class="cp__bottom">
        <span class="cp__preview">{{ preview }}</span>
        <f-badge v-if="chat.unreadCount > 0" :content="chat.unreadCount" color="primary" inline />
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.cp {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border-radius: var(--fui-radius-md);
  text-decoration: none;
  color: inherit;
}
.cp:hover {
  background: rgba(var(--fui-theme-on-background), 0.05);
}
.cp__body {
  flex: 1;
  min-width: 0;
}
.cp__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.cp__name {
  font-weight: 600;
}
.cp__when {
  font-size: 0.75rem;
  opacity: 0.5;
  flex-shrink: 0;
}
.cp__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 2px;
}
.cp__preview {
  opacity: 0.65;
  font-size: 0.88rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
