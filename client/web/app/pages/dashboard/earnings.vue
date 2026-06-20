<script setup lang="ts">
import { format } from 'date-fns'
import { useMyEscrows } from '~/composables/use-payments'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'app', middleware: 'role', requiresRole: 'student' })

const auth = useAuthStore()
const { data: escrows, isPending, suspense } = useMyEscrows()
onServerPrefetch(() => suspense().catch(() => {}))

const released = computed(() =>
  (escrows.value ?? []).filter((e) => e.status === 'released' && e.studentId === auth.user?.id),
)
const currency = computed(() => escrows.value?.[0]?.currency ?? 'NGN')
const total = computed(() => released.value.reduce((s, e) => s + e.amount, 0))

const points = computed(() => {
  const sorted = released.value
    .filter((e) => e.releasedAt)
    .sort((a, b) => new Date(a.releasedAt!).getTime() - new Date(b.releasedAt!).getTime())
  let cum = 0
  return sorted.map((e) => {
    cum += e.amount
    return { x: format(new Date(e.releasedAt!), 'MMM d'), y: cum }
  })
})
</script>

<template>
  <div class="earn">
    <button type="button" class="earn__back" @click="navigateTo('/dashboard')">
      <f-icon icon="arrow-left" /> Dashboard
    </button>
    <h1 class="earn__title">Earnings</h1>

    <div class="earn__total">
      <span class="earn__value">{{ currency }} {{ total.toLocaleString() }}</span>
      <span class="earn__label">total released to you</span>
    </div>

    <p v-if="isPending" class="earn__status">Loading…</p>

    <template v-else-if="released.length">
      <div v-if="points.length > 1" class="earn__chart">
        <f-line-chart :data="points" area color="primary" :zero="true" label="Cumulative earnings over time" />
      </div>

      <ul class="earn__list">
        <li v-for="e in released" :key="e.id" class="earn__item">
          <div>
            <NuxtLink :to="`/projects/${e.projectId}`" class="earn__project">Project {{ e.projectId.slice(0, 8) }}…</NuxtLink>
            <span v-if="e.releasedAt" class="earn__when"> · {{ format(new Date(e.releasedAt), 'PP') }}</span>
          </div>
          <span class="earn__amount">+{{ e.currency }} {{ e.amount.toLocaleString() }}</span>
        </li>
      </ul>
    </template>

    <EmptyState
      v-else
      icon="dollar-sign"
      title="No earnings yet"
      text="Complete a project and approved payments will show here."
    />
  </div>
</template>

<style scoped>
.earn {
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.earn__back {
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
.earn__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.earn__total {
  padding: 22px;
  border-radius: var(--fui-radius-lg);
  background: rgba(var(--fui-theme-primary), 0.06);
  text-align: center;
}
.earn__value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: rgb(var(--fui-theme-primary));
}
.earn__label {
  opacity: 0.7;
  font-size: 0.9rem;
}
.earn__chart {
  height: 240px;
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  border-radius: var(--fui-radius-lg);
  padding: 12px;
}
.earn__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.earn__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  border-radius: var(--fui-radius-md);
  background: rgb(var(--fui-theme-surface));
}
.earn__project {
  color: rgb(var(--fui-theme-primary));
  text-decoration: none;
  font-weight: 600;
}
.earn__when {
  opacity: 0.55;
  font-size: 0.85rem;
}
.earn__amount {
  font-weight: 700;
  color: rgb(var(--fui-theme-success));
}
.earn__status {
  opacity: 0.6;
}
</style>
