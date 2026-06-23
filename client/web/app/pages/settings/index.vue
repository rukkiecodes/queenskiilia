<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'app' })

const auth = useAuthStore()
const { isDark, toggle: toggleTheme } = useAppTheme()

const sections = computed<{ title: string; items: { label: string; icon: string; to: string }[] }[]>(() => [
  {
    title: 'Account',
    items: [
      { label: 'Edit profile', icon: 'user', to: '/profile/edit' },
      { label: 'Verification', icon: 'shield', to: '/verification' },
      ...(auth.isStudent ? [{ label: 'Payouts', icon: 'credit-card', to: '/settings/payouts' }] : []),
    ],
  },
  {
    title: 'Preferences',
    items: [{ label: 'Notifications', icon: 'bell', to: '/settings/notifications' }],
  },
  {
    title: 'About & legal',
    items: [
      { label: 'Help & support', icon: 'help-circle', to: '/settings/help' },
      { label: 'About QueenSkiilia', icon: 'info', to: '/settings/about' },
      { label: 'Terms of Service', icon: 'file-text', to: '/legal/terms' },
      { label: 'Privacy Policy', icon: 'lock', to: '/legal/privacy' },
    ],
  },
])

async function onLogout() {
  await auth.logout()
  await navigateTo('/login')
}
</script>

<template>
  <div class="set">
    <h1 class="set__title">Settings</h1>

    <section class="set__card">
      <div class="set__row set__row--static">
        <span class="set__row-left"><f-icon icon="moon" /> Dark mode</span>
        <f-switch :model-value="isDark" color="primary" @update:model-value="toggleTheme" />
      </div>
    </section>

    <section v-for="s in sections" :key="s.title" class="set__group">
      <h2 class="set__h2">{{ s.title }}</h2>
      <div class="set__card">
        <NuxtLink v-for="item in s.items" :key="item.to" :to="item.to" class="set__row">
          <span class="set__row-left"><f-icon :icon="item.icon" /> {{ item.label }}</span>
          <f-icon icon="chevron-right" class="set__chev" />
        </NuxtLink>
      </div>
    </section>

    <section class="set__group">
      <h2 class="set__h2">Danger zone</h2>
      <div class="set__card">
        <button type="button" class="set__row set__row--btn" @click="onLogout">
          <span class="set__row-left"><f-icon icon="log-out" /> Sign out</span>
        </button>
        <NuxtLink to="/settings/delete-account" class="set__row set__row--danger">
          <span class="set__row-left"><f-icon icon="trash-2" /> Delete account</span>
          <f-icon icon="chevron-right" class="set__chev" />
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.set {
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.set__title {
  margin: 0 0 6px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.set__group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.set__h2 {
  margin: 8px 0 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.5;
}
.set__card {
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  border-radius: var(--fui-radius-lg);
  overflow: hidden;
  background: rgb(var(--fui-theme-surface));
}
.set__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  text-decoration: none;
  color: inherit;
  width: 100%;
  border: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
  border-bottom: 1px solid rgba(var(--fui-theme-on-background), 0.06);
}
.set__row:last-child {
  border-bottom: 0;
}
.set__row:hover:not(.set__row--static) {
  background: rgba(var(--fui-theme-on-background), 0.04);
}
.set__row-left {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
.set__chev {
  opacity: 0.4;
}
.set__row--danger {
  color: rgb(var(--fui-theme-danger));
}
</style>
