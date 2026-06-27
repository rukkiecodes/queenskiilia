<script setup lang="ts">
import StatTile from '~/components/dashboard/stat-tile.vue'
import TalentCard from '~/components/cards/talent-card.vue'
import { useMyProjects } from '~/composables/use-my-projects'
import { useMyEscrows } from '~/composables/use-payments'
import { profileApi } from '~/lib/profile-api'
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
const { data: projects, suspense: projectSuspense } = useMyProjects()
const { data: escrows, suspense: escrowSuspense } = useMyEscrows()
const { data: talents } = await useAsyncData('dash-talents', () =>
  profileApi.searchUsers({ accountType: 'student', limit: 8 }).catch(() => []),
)
onServerPrefetch(async () => {
  await Promise.allSettled([projectSuspense(), escrowSuspense()])
})

const firstName = computed(() => auth.me?.fullName?.split(' ')[0] ?? '')

// ── Stats ─────────────────────────────────────────────────────────────────────
const openCount = computed(() => (projects.value ?? []).filter((p) => p.status === 'open').length)
const activeCount = computed(
  () => (projects.value ?? []).filter((p) => ['in_progress', 'under_review'].includes(p.status)).length,
)
const completedCount = computed(() => (projects.value ?? []).filter((p) => p.status === 'completed').length)
const inEscrow = computed(() =>
  (escrows.value ?? []).filter((e) => e.status === 'held').reduce((s, e) => s + e.amount, 0),
)
const spent = computed(() =>
  (escrows.value ?? []).filter((e) => e.status === 'released').reduce((s, e) => s + e.amount, 0),
)

function parseDate(v?: string | null): Date | null {
  if (!v) return null
  const n = Number(v)
  const d = Number.isFinite(n) && String(n) === v.trim() ? new Date(n) : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

// ── Spending chart: last 6 months from released escrows ───────────────────────
const months = computed(() => {
  const now = new Date()
  const out: { label: string; key: string; value: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push({ label: d.toLocaleString('en', { month: 'short' }), key: `${d.getFullYear()}-${d.getMonth()}`, value: 0 })
  }
  for (const e of escrows.value ?? []) {
    if (e.status !== 'released') continue
    const d = parseDate(e.releasedAt) ?? parseDate(e.createdAt)
    if (!d) continue
    const b = out.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`)
    if (b) b.value += e.amount
  }
  return out
})
const maxMonth = computed(() => Math.max(1, ...months.value.map((m) => m.value)))
const hasSpending = computed(() => months.value.some((m) => m.value > 0))

// ── Activity feed ─────────────────────────────────────────────────────────────
const activity = computed(() => {
  const ev: { icon: string; color: string; text: string; at: Date | null }[] = []
  for (const p of projects.value ?? []) {
    ev.push({ icon: 'plus-circle', color: 'primary', text: `Posted “${p.title}”`, at: parseDate(p.createdAt) })
    if (p.status === 'completed')
      ev.push({ icon: 'check-circle', color: 'success', text: `“${p.title}” was completed`, at: parseDate(p.updatedAt) })
    else if (p.selectedStudent)
      ev.push({ icon: 'user-check', color: 'primary', text: `Talent selected for “${p.title}”`, at: parseDate(p.updatedAt) })
  }
  for (const e of escrows.value ?? []) {
    if (e.status === 'released')
      ev.push({ icon: 'dollar-sign', color: 'success', text: `Released ${money(e.amount)} from escrow`, at: parseDate(e.releasedAt) })
  }
  return ev.sort((a, b) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0)).slice(0, 6)
})
function ago(d: Date | null) {
  if (!d) return ''
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const talentList = computed(() => talents.value ?? [])
</script>

<template>
  <div class="dash">
    <header class="dash__head">
      <h1 class="dash__title">Welcome back{{ firstName ? `, ${firstName}` : '' }}</h1>
      <div class="dash__cta">
        <f-btn color="primary" prepend-icon="plus" @click="navigateTo('/projects/create')">New project</f-btn>
        <f-btn variant="outlined" prepend-icon="users" @click="navigateTo('/talent')">Find talent</f-btn>
      </div>
    </header>

    <!-- Stats -->
    <div class="dash__grid">
      <StatTile icon="briefcase" label="Active projects" :value="activeCount" to="/projects" />
      <StatTile icon="inbox" label="Open projects" :value="openCount" to="/projects" />
      <StatTile icon="check-circle" label="Completed" :value="completedCount" />
      <StatTile icon="credit-card" label="In escrow" :value="money(inEscrow)" to="/payments" />
      <StatTile icon="dollar-sign" label="Total spent" :value="money(spent)" to="/payments" />
    </div>

    <!-- Chart + activity -->
    <div class="dash__cols">
      <section class="panel">
        <header class="panel__head">
          <h2 class="panel__title">Spending</h2>
          <span class="panel__sub">Last 6 months</span>
        </header>
        <div v-if="hasSpending" class="chart">
          <div v-for="m in months" :key="m.key" class="chart__col">
            <div class="chart__bar-wrap">
              <div class="chart__bar" :style="{ height: `${(m.value / maxMonth) * 100}%` }">
                <span v-if="m.value > 0" class="chart__val">{{ money(m.value) }}</span>
              </div>
            </div>
            <span class="chart__label">{{ m.label }}</span>
          </div>
        </div>
        <div v-else class="panel__empty">
          <f-icon icon="trending-up" />
          <p>Your spending will chart here once you release payments.</p>
        </div>
      </section>

      <section class="panel">
        <header class="panel__head"><h2 class="panel__title">Activity</h2></header>
        <ul v-if="activity.length" class="feed">
          <li v-for="(e, i) in activity" :key="i" class="feed__item">
            <span class="feed__dot" :class="`feed__dot--${e.color}`"><f-icon :icon="e.icon" /></span>
            <div class="feed__body">
              <span class="feed__text">{{ e.text }}</span>
              <span class="feed__time">{{ ago(e.at) }}</span>
            </div>
          </li>
        </ul>
        <div v-else class="panel__empty">
          <f-icon icon="activity" />
          <p>No activity yet — post a project to get started.</p>
        </div>
      </section>
    </div>

    <!-- Discover talent — plain, no panel chrome -->
    <section v-if="talentList.length" class="dash__talent">
      <header class="dash__talent-head">
        <h2 class="panel__title">Discover talent</h2>
        <f-btn variant="text" size="small" prepend-icon="users" @click="navigateTo('/talent')">Browse all</f-btn>
      </header>
      <div class="dash__talent-grid">
        <TalentCard v-for="t in talentList" :key="t.id" :user="t" />
      </div>
    </section>

  </div>
</template>

<style scoped>
.dash {
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.dash__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.dash__title {
  margin: 0;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.dash__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 14px;
}
.dash__cols {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 18px;
}
.panel {
  background: rgb(var(--fui-theme-surface));
  border: 1px solid rgba(var(--fui-theme-on-background), 0.08);
  border-radius: 18px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.panel--flush {
  padding: 0;
  overflow: hidden;
}
.panel__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}
.panel__head--pad {
  padding: 18px 20px 0;
}
.panel__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}
.panel__sub {
  font-size: 0.8rem;
  opacity: 0.55;
}
.panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 12px;
  text-align: center;
  opacity: 0.55;
  font-size: 0.9rem;
}
.chart {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 180px;
}
.chart__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  height: 100%;
}
.chart__bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.chart__bar {
  width: 60%;
  min-height: 4px;
  border-radius: 8px 8px 4px 4px;
  background: linear-gradient(180deg, rgb(var(--fui-theme-primary)), rgba(var(--fui-theme-primary), 0.5));
  position: relative;
  transition: height 0.4s ease;
}
.chart__val {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.66rem;
  font-weight: 700;
  white-space: nowrap;
  opacity: 0.75;
}
.chart__label {
  font-size: 0.75rem;
  opacity: 0.6;
  font-weight: 600;
}
.feed {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.feed__item {
  display: flex;
  gap: 12px;
  align-items: center;
}
.feed__dot {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  font-size: 0.9rem;
}
.feed__dot--success {
  background: rgba(var(--fui-theme-success), 0.14);
  color: rgb(var(--fui-theme-success));
}
.feed__dot--primary {
  background: rgba(var(--fui-theme-primary), 0.14);
  color: rgb(var(--fui-theme-primary));
}
.feed__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.feed__text {
  font-size: 0.9rem;
  font-weight: 500;
}
.feed__time {
  font-size: 0.76rem;
  opacity: 0.5;
}
.dash__talent {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.dash__talent-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}
.dash__talent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}
.dash__cta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
@media (max-width: 820px) {
  .dash__cols {
    grid-template-columns: 1fr;
  }
}
</style>
