<script setup lang="ts">
import { format, formatDistanceToNowStrict } from 'date-fns'
import ApplyDialog from '~/components/projects/apply-dialog.vue'
import { useProject } from '~/composables/use-project'
import { useMyApplications } from '~/composables/use-my-applications'
import { useCancelProject } from '~/composables/use-project-mutations'
import { useAuthStore } from '~/stores/auth'
import { SKILL_LEVELS } from '~/types/filters'

definePageMeta({ layout: 'app' })

const route = useRoute()
const id = computed(() => route.params.id as string)
const auth = useAuthStore()

const { data: project, isPending, suspense } = useProject(() => id.value)
onServerPrefetch(() => suspense().catch(() => {}))

const { data: myApps } = useMyApplications()
const applied = computed(
  () => myApps.value?.some((a) => a.projectId === id.value && a.status !== 'withdrawn') ?? false,
)
const canApply = computed(
  () => auth.isStudent && project.value?.status === 'open' && !applied.value,
)

const myLevel = computed(() => auth.me?.studentProfile?.skillLevel ?? null)
const levelGap = computed(() => {
  if (!project.value || !myLevel.value) return false
  const mine = SKILL_LEVELS.indexOf(myLevel.value as (typeof SKILL_LEVELS)[number])
  const required = SKILL_LEVELS.indexOf(project.value.skillLevel)
  return mine >= 0 && required >= 0 && mine < required
})

const deadline = computed(() => {
  if (!project.value) return ''
  const d = new Date(project.value.deadline)
  return Number.isNaN(d.getTime())
    ? project.value.deadline
    : `${format(d, 'PP')} (${formatDistanceToNowStrict(d, { addSuffix: true })})`
})

const isOwner = computed(() => !!auth.user && auth.user.id === project.value?.businessId)
const isSelectedStudent = computed(
  () => !!auth.user && auth.user.id === project.value?.selectedStudent,
)
const isActive = computed(() =>
  ['in_progress', 'under_review', 'completed', 'disputed'].includes(project.value?.status ?? ''),
)
const { mutate: cancelProject, isPending: cancelling } = useCancelProject()
function onCancel() {
  if (project.value && window.confirm('Cancel this project? This cannot be undone.')) {
    cancelProject(project.value.id)
  }
}

const applyOpen = ref(false)
</script>

<template>
  <div v-if="project" class="pd">
    <button type="button" class="pd__back" @click="navigateTo('/projects')">
      <f-icon icon="arrow-left" /> Back to projects
    </button>

    <header class="pd__head">
      <h1 class="pd__title">{{ project.title }}</h1>
      <div class="pd__chips">
        <f-chip color="primary">{{ project.skillLevel }}</f-chip>
        <f-chip>{{ project.status }}</f-chip>
      </div>
    </header>

    <div class="pd__meta">
      <span class="pd__budget">{{ project.currency }} {{ project.budget.toLocaleString() }}</span>
      <span class="pd__deadline">Due {{ deadline }}</span>
    </div>

    <p class="pd__desc">{{ project.description }}</p>

    <div v-if="project.requiredSkills.length" class="pd__skills">
      <f-chip v-for="s in project.requiredSkills" :key="s">{{ s }}</f-chip>
    </div>

    <f-alert v-if="levelGap" type="info" variant="flat" class="pd__note">
      This project asks for a higher skill level than your current one — you can still apply.
    </f-alert>

    <div class="pd__cta">
      <f-btn
        v-if="(isOwner || isSelectedStudent) && isActive"
        color="primary"
        size="large"
        prepend-icon="briefcase"
        @click="navigateTo(`/projects/${project.id}/workspace`)"
      >
        Open workspace
      </f-btn>

      <template v-if="isOwner">
        <f-btn
          v-if="project.status === 'open'"
          color="primary"
          size="large"
          @click="navigateTo(`/projects/${project.id}/applicants`)"
        >
          Review applicants
        </f-btn>
        <f-btn
          v-if="project.status === 'open'"
          variant="text"
          color="danger"
          :loading="cancelling"
          @click="onCancel"
        >
          Cancel project
        </f-btn>
      </template>
      <template v-else-if="!isSelectedStudent">
        <f-btn v-if="canApply" color="primary" size="large" @click="applyOpen = true">Apply now</f-btn>
        <f-btn v-else-if="applied" color="primary" size="large" disabled>Applied</f-btn>
        <p v-else-if="project.status !== 'open'" class="pd__closed">This project is no longer accepting applications.</p>
      </template>
    </div>

    <ApplyDialog v-model="applyOpen" :project-id="project.id" :project-title="project.title" />
  </div>

  <p v-else-if="isPending" class="pd__loading">Loading project…</p>
  <EmptyState v-else title="Project not found" text="This project may have been removed." />
</template>

<style scoped>
.pd {
  max-width: 760px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.pd__back {
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
.pd__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.pd__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.pd__chips {
  display: flex;
  gap: 6px;
}
.pd__meta {
  display: flex;
  gap: 18px;
  align-items: center;
  flex-wrap: wrap;
}
.pd__budget {
  font-size: 1.2rem;
  font-weight: 600;
  color: rgb(var(--fui-theme-primary));
}
.pd__deadline {
  opacity: 0.7;
}
.pd__desc {
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
}
.pd__skills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pd__cta {
  margin-top: 8px;
}
.pd__closed {
  opacity: 0.6;
}
.pd__loading {
  opacity: 0.6;
}
</style>
