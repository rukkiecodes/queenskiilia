<script setup lang="ts">
import { useLeaderboard } from '~/composables/use-leaderboard'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'app' })

const { data: leaders, isPending, suspense } = useLeaderboard()
onServerPrefetch(() => suspense().catch(() => {}))
const auth = useAuthStore()
</script>

<template>
  <div class="lb">
    <h1 class="lb__title">Leaderboard</h1>
    <p class="lb__sub">Top-rated talent on QueenSkiilia.</p>

    <p v-if="isPending" class="lb__status">Loading…</p>

    <ol v-else-if="leaders && leaders.length" class="lb__list">
      <li
        v-for="(u, i) in leaders"
        :key="u.id"
        class="lb__row"
        :class="{ 'lb__row--me': u.id === auth.user?.id }"
        @click="navigateTo(`/talent/${u.id}`)"
      >
        <span class="lb__rank" :class="{ 'lb__rank--top': i < 3 }">{{ i + 1 }}</span>
        <f-avatar :image="u.avatarUrl ?? undefined" :text="(u.fullName ?? 'T').charAt(0).toUpperCase()" :size="40" circle />
        <div class="lb__id">
          <span class="lb__name">{{ u.fullName ?? 'Talent' }}</span>
          <span v-if="u.studentProfile?.skillLevel" class="lb__level">{{ u.studentProfile.skillLevel }}</span>
        </div>
        <span class="lb__rating">
          <template v-if="u.studentProfile?.averageRating != null">★ {{ u.studentProfile.averageRating.toFixed(1) }}</template>
          <template v-else>—</template>
        </span>
      </li>
    </ol>

    <EmptyState v-else icon="award" title="No ranked talent yet" />
  </div>
</template>

<style scoped>
.lb {
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.lb__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.lb__sub {
  margin: 4px 0 12px;
  opacity: 0.65;
}
.lb__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.lb__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  border-radius: var(--fui-radius-md);
  background: rgb(var(--fui-theme-surface));
  cursor: pointer;
}
.lb__row--me {
  border-color: rgb(var(--fui-theme-primary));
  background: rgba(var(--fui-theme-primary), 0.06);
}
.lb__rank {
  width: 26px;
  text-align: center;
  font-weight: 700;
  opacity: 0.6;
}
.lb__rank--top {
  color: rgb(var(--fui-theme-warning));
  opacity: 1;
}
.lb__id {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.lb__name {
  font-weight: 600;
}
.lb__level {
  font-size: 0.8rem;
  opacity: 0.6;
}
.lb__rating {
  font-weight: 600;
  color: rgb(var(--fui-theme-warning));
}
.lb__status {
  opacity: 0.6;
}
</style>
