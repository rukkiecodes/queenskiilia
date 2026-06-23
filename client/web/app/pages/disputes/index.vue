<script setup lang="ts">
import { format } from 'date-fns'
import { useMyDisputes } from '~/composables/use-ratings-disputes'

definePageMeta({ layout: 'app' })

const { data: disputes, isPending, suspense } = useMyDisputes()
onServerPrefetch(() => suspense().catch(() => {}))

const statusColor: Record<string, string | undefined> = {
  raised: 'warning',
  open: 'warning',
  reviewing: 'warning',
  under_review: 'warning',
  resolved: 'success',
}
function fmt(d: string) {
  const date = new Date(d)
  return Number.isNaN(date.getTime()) ? d : format(date, 'PP')
}
</script>

<template>
  <div class="dl">
    <h1 class="dl__title">Disputes</h1>

    <p v-if="isPending" class="dl__status">Loading…</p>

    <ul v-else-if="disputes && disputes.length" class="dl__list">
      <li v-for="d in disputes" :key="d.id" class="dl__item">
        <div class="dl__top">
          <NuxtLink :to="`/projects/${d.projectId}`" class="dl__project">Project {{ d.projectId.slice(0, 8) }}…</NuxtLink>
          <f-chip :color="statusColor[d.status]">{{ d.status }}</f-chip>
        </div>
        <p class="dl__reason">{{ d.reason }}</p>
        <p v-if="d.resolution" class="dl__resolution">Resolution: {{ d.resolution }}</p>
        <p class="dl__date">Raised {{ fmt(d.createdAt) }}</p>
      </li>
    </ul>

    <EmptyState
      v-else
      icon="shield"
      title="No disputes"
      text="Disputes you raise will appear here with their resolution status."
    />
  </div>
</template>

<style scoped>
.dl {
  max-width: 680px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.dl__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.dl__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dl__item {
  padding: 16px;
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  border-radius: var(--fui-radius-lg);
  background: rgb(var(--fui-theme-surface));
}
.dl__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.dl__project {
  font-weight: 600;
  color: rgb(var(--fui-theme-primary));
  text-decoration: none;
}
.dl__reason {
  margin: 8px 0 0;
  opacity: 0.85;
}
.dl__resolution {
  margin: 6px 0 0;
  font-weight: 600;
}
.dl__date {
  margin: 6px 0 0;
  font-size: 0.78rem;
  opacity: 0.5;
}
.dl__status {
  opacity: 0.6;
}
</style>
