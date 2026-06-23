<script setup lang="ts">
import { useAuthFlowStore } from '~/stores/auth-flow'
import type { AccountType } from '~/types/auth'

definePageMeta({ layout: 'auth' })

const authFlow = useAuthFlowStore()
const route = useRoute()
const selected = ref<AccountType | null>(authFlow.accountType)

const options = [
  { value: 'student' as const, title: "I'm talent", text: 'Find projects, take skill tests, get paid.', icon: 'user' },
  { value: 'business' as const, title: "I'm hiring", text: 'Post projects, review applicants, fund escrow.', icon: 'briefcase' },
]

function cont() {
  if (!selected.value) return
  authFlow.setAccountType(selected.value)
  navigateTo({ path: '/login', query: route.query })
}
</script>

<template>
  <div class="atype">
    <h1 class="atype__title">How will you use QueenSkiilia?</h1>

    <div class="atype__grid">
      <button
        v-for="o in options"
        :key="o.value"
        type="button"
        class="atype__card"
        :class="{ 'atype__card--on': selected === o.value }"
        :aria-pressed="selected === o.value"
        @click="selected = o.value"
      >
        <f-icon :icon="o.icon" class="atype__icon" />
        <span class="atype__card-title">{{ o.title }}</span>
        <span class="atype__card-text">{{ o.text }}</span>
      </button>
    </div>

    <f-btn color="primary" block :disabled="!selected" @click="cont">Continue</f-btn>
  </div>
</template>

<style scoped>
.atype {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.atype__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
  text-align: center;
}
.atype__grid {
  display: grid;
  gap: 12px;
}
.atype__card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 18px 20px;
  text-align: left;
  cursor: pointer;
  border-radius: var(--fui-radius-lg);
  border: 2px solid rgba(var(--fui-theme-on-background), 0.12);
  background: rgb(var(--fui-theme-surface));
  color: inherit;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.atype__card:hover {
  border-color: rgba(var(--fui-theme-primary), 0.5);
}
.atype__card--on {
  border-color: rgb(var(--fui-theme-primary));
  background: rgba(var(--fui-theme-primary), 0.06);
}
.atype__icon {
  font-size: 22px;
  color: rgb(var(--fui-theme-primary));
}
.atype__card-title {
  font-weight: 600;
}
.atype__card-text {
  font-size: 0.9rem;
  opacity: 0.7;
}
</style>
