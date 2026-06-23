<script setup lang="ts">
// Batch 0.5 smoke test: stores instantiate + are reactive under SSR; URL-backed
// filter composable round-trips through the query string; toast bridge is callable.
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'
import { useAuthFlowStore } from '~/stores/auth-flow'
import { useNotificationsStore } from '~/stores/notifications'
import { useChatStore } from '~/stores/chat'
import { useUiStore } from '~/stores/ui'

const auth = useAuthStore()
const { isAuthenticated, ready, accountType } = storeToRefs(auth)

const authFlow = useAuthFlowStore()
const { email, accountType: flowAccountType } = storeToRefs(authFlow)

const notifications = useNotificationsStore()
const { unreadCount } = storeToRefs(notifications)

const ui = useUiStore()
const { globalLoading } = storeToRefs(ui)

const chat = useChatStore()
const { byChat } = storeToRefs(chat)
chat.setMessages('demo-chat', [
  { id: 'm1', chatId: 'demo-chat', senderId: 'u1', content: 'hi', attachmentUrls: [], isRead: false, sentAt: '2026-06-19T00:00:00.000Z' },
])
chat.prependMessage('demo-chat', { id: 'temp-1', chatId: 'demo-chat', senderId: 'me', content: 'optimistic', attachmentUrls: [], isRead: false, sentAt: '2026-06-19T00:01:00.000Z', pending: true })

const { search, sortBy, setBudget, reset: resetFilters, queryArgs } = useProjectFilters()

// Exercise SSR-safe store mutations during setup (consistent on server + client).
authFlow.setAccountType('student')
authFlow.setEmail('demo@queenskilla.test')
notifications.setUnreadCount(3)
</script>

<template>
  <main class="smoke">
    <h1 class="smoke__title">Pinia stores + URL filters — smoke test</h1>

    <section class="smoke__card">
      <h2>auth</h2>
      <p>ready: {{ ready }} · isAuthenticated: {{ isAuthenticated }} · accountType: {{ accountType ?? '—' }}</p>
    </section>

    <section class="smoke__card">
      <h2>auth-flow (transient signup)</h2>
      <p>email: {{ email ?? '—' }} · accountType: {{ flowAccountType ?? '—' }}</p>
    </section>

    <section class="smoke__card">
      <h2>notifications</h2>
      <p>unreadCount: <strong>{{ unreadCount }}</strong></p>
      <div class="smoke__row">
        <f-btn color="primary" variant="tonal" @click="notifications.increment()">+1</f-btn>
        <f-btn color="primary" variant="outlined" @click="notifications.decrement()">−1</f-btn>
        <f-btn variant="text" @click="notifications.reset()">reset</f-btn>
      </div>
    </section>

    <section class="smoke__card">
      <h2>ui (loading + toast bridge)</h2>
      <p>globalLoading: <strong>{{ globalLoading }}</strong></p>
      <div class="smoke__row">
        <f-btn color="primary" variant="tonal" @click="ui.startLoading()">startLoading</f-btn>
        <f-btn color="primary" variant="outlined" @click="ui.stopLoading()">stopLoading</f-btn>
        <f-btn color="primary" @click="ui.success({ title: 'Saved', text: 'Toast bridge works' })">
          success toast
        </f-btn>
        <f-btn color="primary" @click="ui.error({ title: 'Oops', text: 'Error toast' })">error toast</f-btn>
      </div>
    </section>

    <section class="smoke__card">
      <h2>chat (optimistic byChat)</h2>
      <p>demo-chat messages: <strong>{{ byChat['demo-chat']?.length ?? 0 }}</strong> (1 server + 1 optimistic)</p>
    </section>

    <section class="smoke__card">
      <h2>filters (URL-backed)</h2>
      <f-input v-model="search" label="Search" placeholder="Type to write ?q=… into the URL" />
      <div class="smoke__row">
        <f-btn variant="tonal" color="primary" @click="sortBy = 'budget_high'">sort: budget_high</f-btn>
        <f-btn variant="outlined" color="primary" @click="setBudget(100, 500)">budget 100–500</f-btn>
        <f-btn variant="text" @click="resetFilters()">reset filters</f-btn>
      </div>
      <pre class="smoke__pre">queryArgs: {{ queryArgs }}</pre>
    </section>
  </main>
</template>

<style scoped>
.smoke {
  min-height: 100dvh;
  padding: 48px clamp(16px, 5vw, 64px);
  background: rgb(var(--fui-theme-background));
  color: rgb(var(--fui-theme-on-background));
  font-family: var(--fui-font-family);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.smoke__title {
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
}
.smoke__card {
  background: rgb(var(--fui-theme-surface));
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  border-radius: var(--fui-radius-lg);
  padding: 16px 20px;
}
.smoke__card h2 {
  margin: 0 0 8px;
  font-size: 0.95rem;
  font-weight: 600;
  opacity: 0.7;
}
.smoke__row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 8px;
}
.smoke__pre {
  margin: 12px 0 0;
  padding: 12px;
  border-radius: var(--fui-radius-md);
  background: rgba(var(--fui-theme-on-background), 0.05);
  font-size: 0.8rem;
  overflow-x: auto;
}
</style>
