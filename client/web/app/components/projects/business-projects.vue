<script setup lang="ts">
import { format } from 'date-fns'
import { useMyProjects } from '~/composables/use-my-projects'
import { useCancelProject } from '~/composables/use-project-mutations'
import type { ProjectStatus } from '~/types/project'

const { data: projects, isPending, suspense } = useMyProjects()
onServerPrefetch(() => suspense().catch(() => {}))

const { mutate: cancel, isPending: cancelling } = useCancelProject()

type Tab = 'all' | 'open' | 'active' | 'completed'
const tabs: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'active', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
]
const tab = ref<Tab>('all')
const activeStatuses: ProjectStatus[] = ['in_progress', 'under_review', 'disputed']

const filtered = computed(() => {
  const list = projects.value ?? []
  if (tab.value === 'all') return list
  if (tab.value === 'active') return list.filter((p) => activeStatuses.includes(p.status))
  return list.filter((p) => p.status === tab.value)
})

const statusColor: Record<string, string | undefined> = {
  open: 'primary',
  in_progress: 'warning',
  under_review: 'warning',
  completed: 'success',
  disputed: 'danger',
  cancelled: undefined,
}

function confirmCancel(id: string) {
  if (window.confirm('Cancel this project? This cannot be undone.')) cancel(id)
}
function fmt(d: string) {
  const date = new Date(d)
  return Number.isNaN(date.getTime()) ? d : format(date, 'PP')
}
</script>

<template>
  <div class="bp">
    <header class="bp__head">
      <h1 class="bp__title">Your projects</h1>
      <f-btn color="primary" prepend-icon="plus" @click="navigateTo('/projects/create')">New project</f-btn>
    </header>

    <div class="bp__tabs">
      <f-btn
        v-for="t in tabs"
        :key="t.id"
        :variant="tab === t.id ? 'tonal' : 'text'"
        :color="tab === t.id ? 'primary' : undefined"
        size="small"
        @click="tab = t.id"
      >
        {{ t.label }}
      </f-btn>
    </div>

    <p v-if="isPending" class="bp__status">Loading…</p>

    <ul v-else-if="filtered.length" class="bp__list">
      <li v-for="p in filtered" :key="p.id" class="bp__item">
        <div class="bp__item-main" @click="navigateTo(`/projects/${p.id}`)">
          <div class="bp__item-top">
            <h3 class="bp__item-title">{{ p.title }}</h3>
            <f-chip :color="statusColor[p.status]">{{ p.status }}</f-chip>
          </div>
          <p class="bp__item-meta">
            {{ p.currency }} {{ p.budget.toLocaleString() }} · Due {{ fmt(p.deadline) }}
          </p>
        </div>
        <div class="bp__item-actions">
          <f-btn
            v-if="p.status === 'open'"
            variant="outlined"
            color="primary"
            size="small"
            @click="navigateTo(`/projects/${p.id}/applicants`)"
          >
            Applicants
          </f-btn>
          <f-btn
            v-if="p.status === 'open'"
            variant="text"
            color="danger"
            size="small"
            :loading="cancelling"
            @click="confirmCancel(p.id)"
          >
            Cancel
          </f-btn>
        </div>
      </li>
    </ul>

    <EmptyState
      v-else
      icon="briefcase"
      title="No projects here"
      text="Post a project to start receiving applications from verified talent."
    >
      <f-btn color="primary" @click="navigateTo('/projects/create')">Create a project</f-btn>
    </EmptyState>
  </div>
</template>

<style scoped>
.bp {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.bp__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.bp__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.bp__tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.bp__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bp__item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  border-radius: var(--fui-radius-lg);
  background: rgb(var(--fui-theme-surface));
}
.bp__item-main {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}
.bp__item-top {
  display: flex;
  align-items: center;
  gap: 10px;
}
.bp__item-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}
.bp__item-meta {
  margin: 4px 0 0;
  opacity: 0.65;
  font-size: 0.85rem;
}
.bp__item-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.bp__status {
  opacity: 0.6;
}
</style>
