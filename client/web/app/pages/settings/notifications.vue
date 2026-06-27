<script setup lang="ts">
import { useNotificationPreferences, useUpdatePreferences } from '~/composables/use-notifications'
import type { NotificationCategory } from '~/types/notification'

definePageMeta({ layout: 'app' })

const { data: prefs, isPending, suspense } = useNotificationPreferences()
onServerPrefetch(() => suspense().catch(() => {}))

const { mutate: update, isPending: saving } = useUpdatePreferences()

const CATEGORIES: { key: NotificationCategory; label: string; desc: string }[] = [
  { key: 'projectUpdates', label: 'Project updates', desc: 'Applications, selections, submissions, reviews' },
  { key: 'messages', label: 'Messages', desc: 'New chat messages' },
  { key: 'payments', label: 'Payments', desc: 'Escrow funding and releases' },
  { key: 'system', label: 'System', desc: 'Account, verification, and platform notices' },
]

function toggle(key: NotificationCategory, value: boolean) {
  update({ [key]: value })
}
</script>

<template>
  <div class="np">
    <button type="button" class="np__back" @click="navigateTo('/settings')">
      <f-icon icon="arrow-left" /> Settings
    </button>
    <h1 class="np__title">Notification preferences</h1>

    <p v-if="isPending" class="np__status">Loading…</p>

    <ul v-else class="np__list">
      <li v-for="c in CATEGORIES" :key="c.key" class="np__item">
        <div class="np__text">
          <span class="np__label">{{ c.label }}</span>
          <span class="np__desc">{{ c.desc }}</span>
        </div>
        <f-switch
          :model-value="prefs?.[c.key] ?? true"
          color="primary"
          :loading="saving"
          @update:model-value="toggle(c.key, $event as boolean)"
        />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.np {
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.np__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: rgb(var(--fui-theme-primary));
  cursor: pointer;
  font: inherit;
  padding: 0;
  align-self: flex-start;
}
.np__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.np__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.np__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  border-radius: var(--fui-radius-lg);
  background: rgb(var(--fui-theme-surface));
}
.np__text {
  display: flex;
  flex-direction: column;
}
.np__label {
  font-weight: 600;
}
.np__desc {
  font-size: 0.85rem;
  opacity: 0.65;
}
.np__status {
  opacity: 0.6;
}
</style>
