<script setup lang="ts">
import NotificationCard from '~/components/cards/notification-card.vue'
import { useMarkAllAsRead, useMarkAsRead, useNotifications } from '~/composables/use-notifications'
import { notificationRoute } from '~/lib/notifications-api'
import type { Notification } from '~/types/notification'

definePageMeta({ layout: 'app' })

const { query, notifications } = useNotifications()
const { isPending, fetchNextPage, hasNextPage, isFetchingNextPage, suspense } = query
onServerPrefetch(() => suspense().catch(() => {}))

const { mutate: markRead } = useMarkAsRead()
const { mutate: markAll, isPending: markingAll } = useMarkAllAsRead()

function open(n: Notification) {
  if (!n.isRead) markRead(n.id)
  const route = notificationRoute(n)
  if (route) navigateTo(route)
}

const hasUnread = computed(() => notifications.value.some((n) => !n.isRead))
</script>

<template>
  <div class="nl">
    <header class="nl__head">
      <h1 class="nl__title">Notifications</h1>
      <f-btn v-if="hasUnread" variant="text" :loading="markingAll" @click="markAll()">Mark all read</f-btn>
    </header>

    <p v-if="isPending" class="nl__status">Loading…</p>

    <div v-else-if="notifications.length" class="nl__list">
      <NotificationCard v-for="n in notifications" :key="n.id" :notification="n" @open="open" />
      <div v-if="hasNextPage" class="nl__more">
        <f-btn variant="text" :loading="isFetchingNextPage" @click="() => fetchNextPage()">Load more</f-btn>
      </div>
    </div>

    <EmptyState v-else icon="bell" title="No notifications" text="You're all caught up." />
  </div>
</template>

<style scoped>
.nl {
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.nl__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}
.nl__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.nl__list {
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  border-radius: var(--fui-radius-lg);
  overflow: hidden;
  background: rgb(var(--fui-theme-surface));
}
.nl__more {
  display: flex;
  justify-content: center;
  padding: 8px;
}
.nl__status {
  opacity: 0.6;
}
</style>
