<script setup lang="ts">
import StatTile from '~/components/dashboard/stat-tile.vue'
import { useMyApplications } from '~/composables/use-my-applications'
import { useMyEscrows } from '~/composables/use-payments'
import { useMyPortfolio } from '~/composables/use-portfolio'
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
const { data: applications, suspense: appSuspense } = useMyApplications()
const { data: escrows, suspense: escrowSuspense } = useMyEscrows()
const { data: portfolio, suspense: portfolioSuspense } = useMyPortfolio()
onServerPrefetch(async () => {
  await Promise.allSettled([appSuspense(), escrowSuspense(), portfolioSuspense()])
})

const currency = computed(() => escrows.value?.[0]?.currency ?? 'NGN')
const earnings = computed(() =>
  (escrows.value ?? [])
    .filter((e) => e.status === 'released' && e.studentId === auth.user?.id)
    .reduce((s, e) => s + e.amount, 0),
)
const activeCount = computed(() => (applications.value ?? []).filter((a) => a.status === 'accepted').length)
const pendingCount = computed(() => (applications.value ?? []).filter((a) => a.status === 'pending').length)
const rating = computed(() => auth.me?.studentProfile?.averageRating ?? null)
const portfolioCount = computed(() => portfolio.value?.length ?? 0)
const firstName = computed(() => auth.me?.fullName?.split(' ')[0] ?? '')
</script>

<template>
  <div class="dash">
    <h1 class="dash__title">Welcome back{{ firstName ? `, ${firstName}` : '' }}</h1>

    <div class="dash__grid">
      <StatTile icon="dollar-sign" label="Earnings" :value="`${currency} ${earnings.toLocaleString()}`" to="/dashboard/earnings" />
      <StatTile icon="briefcase" label="Active projects" :value="activeCount" />
      <StatTile icon="file-text" label="Pending applications" :value="pendingCount" to="/projects/applications" />
      <StatTile icon="star" label="Avg rating" :value="rating != null ? rating.toFixed(1) : '—'" />
      <StatTile icon="image" label="Portfolio items" :value="portfolioCount" to="/portfolio" />
    </div>

    <div class="dash__cta">
      <f-btn color="primary" prepend-icon="search" @click="navigateTo('/projects')">Find work</f-btn>
      <f-btn variant="outlined" prepend-icon="award" @click="navigateTo('/dashboard/leaderboard')">Leaderboard</f-btn>
      <f-btn variant="text" prepend-icon="dollar-sign" @click="navigateTo('/dashboard/earnings')">Earnings</f-btn>
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
