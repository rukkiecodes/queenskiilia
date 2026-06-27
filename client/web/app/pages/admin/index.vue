<script setup lang="ts">
import { useAdminInfo } from '~/lib/admin-api'
import { fetchAdminStats } from '~/lib/admin-queries'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Admin — Overview' })

const admin = useAdminInfo()
const { data: stats, pending, error } = await useAsyncData('admin-stats', () => fetchAdminStats())

const headline = computed(() =>
  stats.value
    ? [
        {
          label: 'Total users',
          value: String(stats.value.totalUsers),
          sub: `${stats.value.students} talent · ${stats.value.businesses} business`,
        },
        {
          label: 'Projects',
          value: String(stats.value.totalProjects),
          sub: `${stats.value.openProjects} open · ${stats.value.completedProjects} completed`,
        },
        { label: 'Escrow held', value: money(stats.value.escrowHeld), sub: 'In escrow now' },
        { label: 'Escrow released', value: money(stats.value.escrowReleased), sub: 'Paid out to talent' },
      ]
    : [],
)

const tiles = computed(() => [
  { to: '/admin/verifications', icon: 'shield', label: 'Verifications', count: stats.value?.pendingVerifications, hint: 'pending review' },
  { to: '/admin/disputes', icon: 'alert-triangle', label: 'Disputes', count: stats.value?.openDisputes, hint: 'open' },
  { to: '/admin/reports', icon: 'flag', label: 'Reports', count: stats.value?.pendingReports, hint: 'open' },
  { to: '/admin/users', icon: 'users', label: 'Users', count: stats.value?.verifiedUsers, hint: 'verified' },
])
</script>

<template>
  <div>
    <h1 class="ov__title">Overview</h1>
    <p class="ov__sub">Welcome back, {{ admin?.name || admin?.email }}.</p>

    <p v-if="error" class="ov__error">
      Couldn't load stats — your session may have expired.
      <NuxtLink to="/admin/login">Sign in again</NuxtLink>.
    </p>

    <!-- Headline stats -->
    <div v-if="pending && !stats" class="ov__stats">
      <div v-for="n in 4" :key="n" class="ov__stat ov__stat--skel" />
    </div>
    <div v-else-if="stats" class="ov__stats">
      <div v-for="s in headline" :key="s.label" class="ov__stat">
        <span class="ov__stat-label">{{ s.label }}</span>
        <strong class="ov__stat-value">{{ s.value }}</strong>
        <span class="ov__stat-sub">{{ s.sub }}</span>
      </div>
    </div>

    <!-- Section queues -->
    <h2 class="ov__h2">Queues</h2>
    <div class="ov__grid">
      <NuxtLink v-for="t in tiles" :key="t.to" :to="t.to" class="ov__tile">
        <span class="ov__icon"><f-icon :icon="t.icon" /></span>
        <span class="ov__tile-top">
          <strong>{{ t.label }}</strong>
          <span v-if="(t.count ?? 0) > 0" class="ov__badge">{{ t.count }}</span>
        </span>
        <span class="ov__hint">{{ t.count ?? 0 }} {{ t.hint }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.ov__title {
  margin: 0 0 4px;
}
.ov__sub {
  opacity: 0.65;
  margin: 0 0 24px;
}
.ov__error {
  background: rgba(229, 72, 77, 0.1);
  color: #e5484d;
  padding: 10px 14px;
  border-radius: 10px;
  margin: 0 0 20px;
}
.ov__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
.ov__stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 18px 20px;
  border-radius: 14px;
  background: rgb(var(--fui-theme-surface));
  border: 1px solid rgba(var(--fui-theme-on-surface), 0.08);
}
.ov__stat--skel {
  height: 96px;
  animation: ov-pulse 1.2s ease infinite;
}
@keyframes ov-pulse {
  50% { opacity: 0.5; }
}
.ov__stat-label {
  font-size: 0.82rem;
  opacity: 0.6;
}
.ov__stat-value {
  font-size: 1.7rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.ov__stat-sub {
  font-size: 0.8rem;
  opacity: 0.55;
}
.ov__h2 {
  margin: 32px 0 14px;
  font-size: 1.05rem;
}
.ov__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.ov__tile {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px;
  border-radius: 14px;
  background: rgb(var(--fui-theme-surface));
  border: 1px solid rgba(var(--fui-theme-on-surface), 0.08);
  color: inherit;
  text-decoration: none;
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.ov__tile:hover {
  border-color: rgba(var(--fui-theme-primary), 0.5);
  transform: translateY(-2px);
}
.ov__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(var(--fui-theme-primary), 0.12);
  color: rgb(var(--fui-theme-primary));
  margin-bottom: 6px;
}
.ov__tile-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ov__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 11px;
  background: #e5484d;
  color: #fff;
  font-size: 0.76rem;
  font-weight: 700;
}
.ov__hint {
  opacity: 0.6;
  font-size: 0.86rem;
}
</style>
