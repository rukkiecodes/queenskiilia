<script setup lang="ts">
import { formatDistanceToNowStrict } from 'date-fns'
import { notificationIcon } from '~/lib/notifications-api'
import type { Notification } from '~/types/notification'

const props = defineProps<{ notification: Notification }>()
const emit = defineEmits<{ open: [n: Notification] }>()

const icon = computed(() => notificationIcon(props.notification.type))
const when = computed(() => {
  const d = new Date(props.notification.createdAt)
  return Number.isNaN(d.getTime()) ? '' : formatDistanceToNowStrict(d, { addSuffix: true })
})
</script>

<template>
  <button
    type="button"
    class="nc"
    :class="{ 'nc--unread': !notification.isRead }"
    @click="emit('open', notification)"
  >
    <span class="nc__icon"><f-icon :icon="icon" /></span>
    <div class="nc__body">
      <p class="nc__title">{{ notification.title }}</p>
      <p class="nc__text">{{ notification.body }}</p>
      <span class="nc__when">{{ when }}</span>
    </div>
    <span v-if="!notification.isRead" class="nc__dot" aria-label="Unread" />
  </button>
</template>

<style scoped>
.nc {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  width: 100%;
  text-align: left;
  padding: 14px 16px;
  border: 0;
  border-bottom: 1px solid rgba(var(--fui-theme-on-background), 0.08);
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.nc:hover {
  background: rgba(var(--fui-theme-on-background), 0.04);
}
.nc--unread {
  background: rgba(var(--fui-theme-primary), 0.05);
}
.nc__icon {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 9999px;
  background: rgba(var(--fui-theme-primary), 0.12);
  color: rgb(var(--fui-theme-primary));
}
.nc__body {
  flex: 1;
  min-width: 0;
}
.nc__title {
  margin: 0;
  font-weight: 600;
}
.nc__text {
  margin: 2px 0 0;
  opacity: 0.75;
  font-size: 0.9rem;
}
.nc__when {
  font-size: 0.75rem;
  opacity: 0.5;
}
.nc__dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: rgb(var(--fui-theme-primary));
  margin-top: 6px;
}
</style>
