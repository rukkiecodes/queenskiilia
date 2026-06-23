<script setup lang="ts">
import ApplicantRow from '~/components/projects/applicant-row.vue'
import { useProject } from '~/composables/use-project'
import { useProjectApplications } from '~/composables/use-project-applications'
import { useSelectStudent } from '~/composables/use-project-mutations'

definePageMeta({ layout: 'app', middleware: 'role', requiresRole: 'business' })

const route = useRoute()
const id = computed(() => route.params.id as string)

const { data: project } = useProject(() => id.value)
const { data: applications, isPending, suspense } = useProjectApplications(() => id.value)
onServerPrefetch(() => suspense().catch(() => {}))

const { mutate: select, isPending: selecting } = useSelectStudent()
const selectable = computed(() => project.value?.status === 'open' && !project.value?.selectedStudent)

function choose(studentId: string) {
  if (window.confirm('Select this student? This closes the project to new applications.')) {
    select({ projectId: id.value, studentId })
  }
}
</script>

<template>
  <div class="appl">
    <button type="button" class="appl__back" @click="navigateTo('/projects')">
      <f-icon icon="arrow-left" /> Your projects
    </button>

    <h1 class="appl__title">Applicants</h1>
    <p v-if="project" class="appl__sub">{{ project.title }}</p>

    <f-alert v-if="project?.selectedStudent" type="success" variant="flat" class="appl__selected">
      A student has been selected. Fund the escrow to begin the work.
      <f-btn color="primary" size="small" class="appl__fund" @click="navigateTo(`/projects/${id}/fund`)">Fund escrow</f-btn>
    </f-alert>

    <p v-if="isPending" class="appl__status">Loading applicants…</p>

    <div v-else-if="applications && applications.length" class="appl__list">
      <ApplicantRow
        v-for="a in applications"
        :key="a.id"
        :application="a"
        :selectable="selectable"
        :selecting="selecting"
        @select="choose"
      />
    </div>

    <EmptyState
      v-else
      icon="users"
      title="No applicants yet"
      text="Share your project or wait for verified talent to apply."
    />
  </div>
</template>

<style scoped>
.appl {
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.appl__back {
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
.appl__title {
  margin: 4px 0 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.appl__sub {
  margin: 0;
  opacity: 0.7;
}
.appl__selected {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.appl__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}
.appl__status {
  opacity: 0.6;
}
</style>
