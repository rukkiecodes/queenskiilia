<script setup lang="ts">
import { format } from 'date-fns'
import ReviewPanel from '~/components/projects/review-panel.vue'
import { useProject } from '~/composables/use-project'
import { useSubmission } from '~/composables/use-submissions'
import { useChatForProject } from '~/composables/use-my-chats'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'app' })

const route = useRoute()
const id = computed(() => route.params.id as string)
const auth = useAuthStore()

const { data: project, suspense: projectSuspense } = useProject(() => id.value)
const { data: submission, suspense: submissionSuspense } = useSubmission(() => id.value)
onServerPrefetch(async () => {
  await Promise.allSettled([projectSuspense(), submissionSuspense()])
})
const { data: chat } = useChatForProject(() => id.value)

const isOwner = computed(() => !!auth.user && auth.user.id === project.value?.businessId)
const isStudent = computed(() => !!auth.user && auth.user.id === project.value?.selectedStudent)

const statusColor: Record<string, string | undefined> = {
  in_progress: 'warning',
  under_review: 'warning',
  completed: 'success',
  disputed: 'danger',
  open: 'primary',
  cancelled: undefined,
}
const deadline = computed(() => {
  if (!project.value) return ''
  const d = new Date(project.value.deadline)
  return Number.isNaN(d.getTime()) ? project.value.deadline : format(d, 'PP')
})
</script>

<template>
  <div v-if="project" class="ws">
    <button type="button" class="ws__back" @click="navigateTo(`/projects/${project.id}`)">
      <f-icon icon="arrow-left" /> Project
    </button>

    <header class="ws__head">
      <h1 class="ws__title">{{ project.title }}</h1>
      <f-chip :color="statusColor[project.status]">{{ project.status }}</f-chip>
    </header>
    <div class="ws__bar">
      <span class="ws__deadline">Due {{ deadline }}</span>
      <f-btn v-if="chat" variant="outlined" size="small" prepend-icon="message-circle" @click="navigateTo(`/chat/${chat.id}`)">
        Open chat
      </f-btn>
    </div>

    <!-- Student view -->
    <section v-if="isStudent" class="ws__section">
      <template v-if="!submission">
        <p class="ws__hint">Ready to deliver? Upload your work for review.</p>
        <f-btn color="primary" @click="navigateTo(`/projects/${project.id}/submit`)">Submit work</f-btn>
      </template>
      <template v-else-if="submission.status === 'revision_requested'">
        <f-alert type="warning" variant="flat">
          <strong>Revision requested.</strong> {{ submission.feedback }}
        </f-alert>
        <f-btn color="primary" @click="navigateTo(`/projects/${project.id}/submit`)">Resubmit work</f-btn>
      </template>
      <f-alert v-else-if="submission.status === 'approved'" type="success" variant="flat">
        Your work was approved — payment released. 🎉
      </f-alert>
      <f-alert v-else type="info" variant="flat">
        Work submitted — waiting for the client to review.
      </f-alert>
    </section>

    <!-- Business view -->
    <section v-else-if="isOwner" class="ws__section">
      <ReviewPanel v-if="submission" :submission="submission" />
      <EmptyState
        v-else
        icon="clock"
        title="No submission yet"
        text="The student hasn't submitted their work yet."
      />
    </section>

    <section v-else class="ws__section">
      <EmptyState icon="lock" title="Not your project" text="Only the client and selected student can view this workspace." />
    </section>

    <div
      v-if="(isOwner || isStudent) && ['in_progress', 'under_review', 'completed', 'disputed'].includes(project.status)"
      class="ws__footer"
    >
      <f-btn
        v-if="project.status === 'completed'"
        color="primary"
        variant="outlined"
        prepend-icon="star"
        @click="navigateTo(`/projects/${project.id}/rate`)"
      >
        Leave a rating
      </f-btn>
      <f-btn
        v-if="['in_progress', 'under_review'].includes(project.status)"
        variant="text"
        color="danger"
        prepend-icon="alert-triangle"
        @click="navigateTo(`/projects/${project.id}/dispute`)"
      >
        Raise a dispute
      </f-btn>
    </div>
  </div>

  <p v-else class="ws__loading">Loading…</p>
</template>

<style scoped>
.ws {
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ws__back {
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
.ws__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.ws__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.ws__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(var(--fui-theme-on-background), 0.1);
}
.ws__deadline {
  opacity: 0.7;
}
.ws__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 6px;
}
.ws__hint {
  margin: 0;
  opacity: 0.75;
}
.ws__loading {
  opacity: 0.6;
}
.ws__footer {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(var(--fui-theme-on-background), 0.1);
}
</style>
