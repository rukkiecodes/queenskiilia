<script setup lang="ts">
import { useAuthFlowStore } from '~/stores/auth-flow'
import type { AccountType } from '~/types/auth'

definePageMeta({ layout: 'auth' })

const authFlow = useAuthFlowStore()
const route = useRoute()
const selected = ref<AccountType | null>(authFlow.accountType)

const options = [
  { value: 'student' as const, title: "I'm talent", text: 'Find projects, take skill tests, and get paid.', icon: 'user' },
  { value: 'business' as const, title: "I'm hiring", text: 'Post projects, review applicants, fund escrow.', icon: 'briefcase' },
]

function cont() {
  if (!selected.value) return
  authFlow.setAccountType(selected.value)
  navigateTo({ path: '/login', query: route.query })
}
</script>

<template>
  <div class="step">
    <header class="step__head">
      <span class="step__eyebrow">Get started</span>
      <h1 class="step__title">How will you use QueenSkiilia?</h1>
      <p class="step__sub">Choose the option that fits you — you can change this later.</p>
    </header>

    <div class="step__options">
      <f-option-card
        v-for="o in options"
        :key="o.value"
        :icon="o.icon"
        :title="o.title"
        :text="o.text"
        :selected="selected === o.value"
        @select="selected = o.value"
      />
    </div>

    <f-btn color="primary" block size="large" :disabled="!selected" @click="cont">Continue</f-btn>
  </div>
</template>

<style scoped>
.step__head {
  margin-bottom: 28px;
}
.step__eyebrow {
  display: inline-block;
  margin-bottom: 10px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgb(var(--fui-theme-primary));
}
.step__title {
  margin: 0 0 8px;
  font-size: clamp(1.5rem, 3vw, 1.95rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.15;
}
.step__sub {
  margin: 0;
  opacity: 0.7;
}
.step__options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 28px;
}
</style>
