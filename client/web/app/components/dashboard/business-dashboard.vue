<script setup lang="ts">
import StatTile from '~/components/dashboard/stat-tile.vue'
import { useMyProjects } from '~/composables/use-my-projects'
import { useMyEscrows } from '~/composables/use-payments'
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
const { data: projects, suspense: projectSuspense } = useMyProjects()
const { data: escrows, suspense: escrowSuspense } = useMyEscrows()
onServerPrefetch(async () => {
  await Promise.allSettled([projectSuspense(), escrowSuspense()])
})

const openCount = computed(() => (projects.value ?? []).filter((p) => p.status === 'open').length)
const activeCount = computed(
  () => (projects.value ?? []).filter((p) => ['in_progress', 'under_review'].includes(p.status)).length,
)
const completedCount = computed(() => (projects.value ?? []).filter((p) => p.status === 'completed').length)
const currency = computed(() => escrows.value?.[0]?.currency ?? 'NGN')
const inEscrow = computed(() =>
  (escrows.value ?? []).filter((e) => e.status === 'held').reduce((s, e) => s + e.amount, 0),
)
const spent = computed(() =>
  (escrows.value ?? []).filter((e) => e.status === 'released').reduce((s, e) => s + e.amount, 0),
)
const firstName = computed(() => auth.me?.fullName?.split(' ')[0] ?? '')
</script>

<template>
  <div class="dash">
    <h1 class="dash__title">Welcome back{{ firstName ? `, ${firstName}` : '' }}</h1>

    <div class="dash__grid">
      <StatTile icon="briefcase" label="Active projects" :value="activeCount" to="/projects" />
      <StatTile icon="inbox" label="Open projects" :value="openCount" to="/projects" />
      <StatTile icon="check-circle" label="Completed" :value="completedCount" />
      <StatTile icon="credit-card" label="In escrow" :value="`${currency} ${inEscrow.toLocaleString()}`" to="/payments" />
      <StatTile icon="dollar-sign" label="Total spent" :value="`${currency} ${spent.toLocaleString()}`" to="/payments" />
    </div>

    <div class="dash__cta">
      <f-btn color="primary" prepend-icon="plus" @click="navigateTo('/projects/create')">New project</f-btn>
      <f-btn variant="outlined" prepend-icon="users" @click="navigateTo('/talent')">Find talent</f-btn>
    </div>
  </div>
</template>

<style scoped>
.dash {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.dash__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.dash__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}
.dash__cta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
