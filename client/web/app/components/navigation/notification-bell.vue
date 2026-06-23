<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useNotificationsStore } from '~/stores/notifications'
import { useUnreadCount } from '~/composables/use-unread-count'

const { unreadCount } = storeToRefs(useNotificationsStore())
const { refresh } = useUnreadCount()

onMounted(refresh)
</script>

<template>
  <f-badge
    :model-value="unreadCount > 0"
    :content="unreadCount > 99 ? '99+' : unreadCount"
    color="danger"
  >
    <f-btn variant="text" icon="bell" aria-label="Notifications" @click="navigateTo('/notifications')" />
  </f-badge>
</template>
