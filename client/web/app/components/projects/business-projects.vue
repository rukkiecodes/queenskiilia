<script setup lang="ts">
import { format } from 'date-fns'
import { useMyProjects } from '~/composables/use-my-projects'
import { useCancelProject } from '~/composables/use-project-mutations'
import type { ProjectStatus } from '~/types/project'

const { data: projects, isPending, suspense } = useMyProjects()
onServerPrefetch(() => suspense().catch(() => {}))

const { mutate: cancel, isPending: cancelling } = useCancelProject()
const { confirm } = useConfirm()

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

async function confirmCancel(id: string) {
  const ok = await confirm({
    title: 'Cancel project?',
    message: 'This permanently cancels the project and cannot be undone.',
    confirmLabel: 'Cancel project',
    cancelLabel: 'Keep it',
    danger: true,
  })
  if (ok) cancel(id)
}
function fmt(d: string) {
  const date = new Date(d)
  return Number.isNaN(date.getTime()) ? d : format(date, 'PP')
}
function timeline(p: { deadline: string | null; durationDays: number | null }) {
  if (!p.deadline) return p.durationDays ? `${p.durationDays}-day delivery` : 'Flexible timeline'
  return `Due ${fmt(p.deadline)}`
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

    <div v-else-if="filtered.length" class="bp__grid">
      <f-card v-for="p in filtered" :key="p.id" type="9" class="bpcard">
        <template #img>
          <img
            :src="p.thumbnailUrl || '/default-project.jpg'"
            :alt="p.title"
            loading="lazy"
            class="bpcard__cover"
            @click="navigateTo(`/projects/${p.id}`)"
          />
        </template>

        <template #title>
          <h3 class="bpcard__title">{{ p.title }}</h3>
        </template>

        <template #text>
          <f-chip :color="statusColor[p.status]" class="bpcard__chip">{{ statusLabel(p.status) }}</f-chip>
          <div class="bpcard__meta">
            <span class="bpcard__budget">{{ money(p.budget) }}</span>
            <span class="bpcard__timeline">{{ timeline(p) }}</span>
          </div>
        </template>

        <template #buttons>
          <div class="bpcard__actions">
            <f-btn
              v-if="p.status === 'open'"
              color="primary"
              size="small"
              block
              @click="navigateTo(`/projects/${p.id}/applicants`)"
            >
              Review applicants
            </f-btn>
            <f-btn
              v-else-if="['in_progress', 'under_review', 'disputed'].includes(p.status)"
              color="primary"
              size="small"
              block
              prepend-icon="briefcase"
              @click="navigateTo(`/projects/${p.id}/workspace`)"
            >
              Open workspace
            </f-btn>
            <f-btn v-else size="small" block variant="outlined" @click="navigateTo(`/projects/${p.id}`)">
              View project
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
        </template>
      </f-card>
    </div>

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
.bp__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
.bpcard {
  width: 100%;
}
.bpcard__cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  cursor: pointer;
}
.bpcard__title {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.bpcard__chip {
  margin: 6px 0;
}
.bpcard__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 2px;
}
.bpcard__budget {
  color: rgb(var(--fui-theme-primary));
}
.bpcard__timeline {
  opacity: 0.7;
}
.bpcard__actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}
.bp__status {
  opacity: 0.6;
}
</style>
