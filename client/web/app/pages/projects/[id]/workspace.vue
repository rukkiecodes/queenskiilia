<script setup lang="ts">
import { format } from 'date-fns'
import ReviewPanel from '~/components/projects/review-panel.vue'
import { useProject } from '~/composables/use-project'
import { useSubmission } from '~/composables/use-submissions'
import { useChatForProject } from '~/composables/use-my-chats'
import { useUser } from '~/composables/use-user'
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

// The other party in the room: client sees the talent, talent sees the client.
const { data: talentUser } = useUser(() => project.value?.selectedStudent ?? '')
const counterpart = computed(() => {
  const p = project.value
  if (!p) return null
  if (isOwner.value) {
    const t = talentUser.value
    const name = t?.fullName || 'Talent'
    return { name, avatar: t?.avatarUrl || undefined, initial: name.charAt(0).toUpperCase(), role: 'Talent' }
  }
  const b = p.business
  const name = b?.businessProfile?.companyName || b?.fullName || 'Client'
  return { name, avatar: b?.avatarUrl || undefined, initial: name.charAt(0).toUpperCase(), role: 'Client' }
})

const statusColor: Record<string, string | undefined> = {
  in_progress: 'warning',
  under_review: 'warning',
  completed: 'success',
  disputed: 'danger',
  open: 'primary',
  cancelled: undefined,
}
const deadline = computed(() => {
  const p = project.value
  if (!p || !p.deadline) return p?.durationDays ? `${p.durationDays}-day delivery` : '—'
  const d = new Date(p.deadline)
  return Number.isNaN(d.getTime()) ? p.deadline : format(d, 'PP')
})

// Progress through the delivery lifecycle.
const steps = ['In progress', 'Submitted', 'Completed']
const currentStep = computed(() => {
  const s = project.value?.status
  const sub = submission.value?.status
  if (s === 'completed' || sub === 'approved') return 2
  if (sub === 'submitted' || sub === 'pending' || s === 'under_review') return 1
  return 0
})

// Compact recap of what was submitted (live URL leads the file list).
const liveUrl = computed(() => submission.value?.fileUrls?.[0] ?? null)
const extraFiles = computed(() => submission.value?.fileUrls?.slice(1) ?? [])
function fileName(url: string) {
  try {
    return decodeURIComponent(url.split('/').pop() ?? 'file').split('?')[0]
  } catch {
    return 'file'
  }
}
</script>

<template>
  <div v-if="project" class="ws">
    <button type="button" class="ws__back" @click="navigateTo(`/projects/${project.id}`)">
      <f-icon icon="arrow-left" /> Project
    </button>

    <!-- ── Header card ──────────────────────────────────────────────────── -->
    <section class="ws-head">
      <div class="ws-head__top">
        <h1 class="ws-head__title">{{ project.title }}</h1>
        <f-chip :color="statusColor[project.status]">{{ statusLabel(project.status) }}</f-chip>
      </div>

      <div class="ws-head__row">
        <div v-if="counterpart" class="ws-head__person">
          <f-avatar :image="counterpart.avatar" :text="counterpart.initial" :size="40" circle />
          <div class="ws-head__person-text">
            <span class="ws-head__person-name">{{ counterpart.name }}</span>
            <span class="ws-head__person-role">{{ counterpart.role }}</span>
          </div>
        </div>
        <f-btn
          v-if="chat"
          variant="outlined"
          size="small"
          prepend-icon="message-circle"
          @click="navigateTo(`/chat/${chat.id}`)"
        >
          Open chat
        </f-btn>
      </div>

      <div class="ws-head__facts">
        <div class="ws-fact">
          <span class="ws-fact__label">Budget</span>
          <span class="ws-fact__value ws-fact__value--accent">
            {{ project.currency }} {{ project.budget.toLocaleString() }}
          </span>
        </div>
        <div class="ws-fact">
          <span class="ws-fact__label">Deadline</span>
          <span class="ws-fact__value">{{ deadline }}</span>
        </div>
      </div>
    </section>

    <!-- ── Progress stepper ─────────────────────────────────────────────── -->
    <ol class="ws-steps">
      <li
        v-for="(s, i) in steps"
        :key="s"
        class="ws-step"
        :class="{ 'ws-step--done': i < currentStep, 'ws-step--current': i === currentStep }"
      >
        <span class="ws-step__dot">
          <f-icon v-if="i < currentStep" icon="check" />
          <template v-else>{{ i + 1 }}</template>
        </span>
        <span class="ws-step__label">{{ s }}</span>
      </li>
    </ol>

    <!-- ── Student view ─────────────────────────────────────────────────── -->
    <section v-if="isStudent" class="ws-card">
      <template v-if="!submission || submission.status === 'revision_requested'">
        <f-alert
          v-if="submission?.status === 'revision_requested'"
          type="warning"
          variant="flat"
        >
          <strong>Revision requested.</strong> {{ submission.feedback }}
        </f-alert>
        <h2 class="ws-card__title">Ready to deliver?</h2>
        <p class="ws-card__text">Share the live URL of your work for the client to review.</p>
        <f-btn color="primary" size="large" prepend-icon="upload" @click="navigateTo(`/projects/${project.id}/submit`)">
          {{ submission?.status === 'revision_requested' ? 'Resubmit work' : 'Submit work' }}
        </f-btn>
      </template>

      <f-alert v-else-if="submission.status === 'approved'" type="success" variant="flat">
        Your work was approved — payment released. 🎉
      </f-alert>

      <template v-else>
        <f-alert type="info" variant="flat">Work submitted — waiting for the client to review.</f-alert>
        <div v-if="liveUrl" class="ws-recap">
          <span class="ws-fact__label">Your submission</span>
          <a :href="liveUrl" target="_blank" rel="noopener noreferrer" class="ws-recap__live">
            <f-icon icon="external-link" /> {{ liveUrl }}
          </a>
          <a
            v-for="f in extraFiles"
            :key="f"
            :href="f"
            target="_blank"
            rel="noopener noreferrer"
            class="ws-recap__file"
          >
            <f-icon icon="paperclip" /> {{ fileName(f) }}
          </a>
        </div>
      </template>
    </section>

    <!-- ── Business view ────────────────────────────────────────────────── -->
    <section v-else-if="isOwner" class="ws-card">
      <ReviewPanel v-if="submission" :submission="submission" />
      <EmptyState
        v-else
        icon="clock"
        title="No submission yet"
        text="The talent hasn't submitted their work yet. You'll see it here when they do."
      />
    </section>

    <section v-else class="ws-card">
      <EmptyState icon="lock" title="Not your project" text="Only the client and selected talent can view this workspace." />
    </section>

    <!-- ── Footer actions ───────────────────────────────────────────────── -->
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
  max-width: 680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
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

/* ── Header card ───────────────────────────────────────────────────────── */
.ws-head {
  background: rgb(var(--fui-theme-surface));
  border: 1px solid rgba(var(--fui-theme-on-background), 0.08);
  border-radius: 20px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ws-head__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.ws-head__title {
  margin: 0;
  font-size: clamp(1.3rem, 2.6vw, 1.6rem);
  font-weight: 700;
  letter-spacing: -0.025em;
}
.ws-head__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.ws-head__person {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ws-head__person-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.ws-head__person-name {
  font-weight: 600;
}
.ws-head__person-role {
  font-size: 0.78rem;
  opacity: 0.55;
}
.ws-head__facts {
  display: flex;
  gap: 28px;
  padding-top: 14px;
  border-top: 1px solid rgba(var(--fui-theme-on-background), 0.08);
}
.ws-fact {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.ws-fact__label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.5;
}
.ws-fact__value {
  font-weight: 600;
}
.ws-fact__value--accent {
  color: rgb(var(--fui-theme-primary));
}

/* ── Stepper ───────────────────────────────────────────────────────────── */
.ws-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: flex-start;
}
.ws-step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  text-align: center;
}
.ws-step::before {
  content: '';
  position: absolute;
  top: 15px;
  left: -50%;
  width: 100%;
  height: 2px;
  background: rgba(var(--fui-theme-on-background), 0.14);
  z-index: 0;
}
.ws-step:first-child::before {
  display: none;
}
.ws-step--done::before,
.ws-step--current::before {
  background: rgb(var(--fui-theme-primary));
}
.ws-step__dot {
  position: relative;
  z-index: 1;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  background: rgb(var(--fui-theme-surface));
  border: 2px solid rgba(var(--fui-theme-on-background), 0.18);
  color: rgba(var(--fui-theme-on-background), 0.5);
}
.ws-step--done .ws-step__dot,
.ws-step--current .ws-step__dot {
  background: rgb(var(--fui-theme-primary));
  border-color: rgb(var(--fui-theme-primary));
  color: #fff;
}
.ws-step__label {
  font-size: 0.82rem;
  font-weight: 600;
  opacity: 0.6;
}
.ws-step--current .ws-step__label {
  opacity: 1;
}

/* ── Action card ───────────────────────────────────────────────────────── */
.ws-card {
  background: rgb(var(--fui-theme-surface));
  border: 1px solid rgba(var(--fui-theme-on-background), 0.08);
  border-radius: 20px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: flex-start;
}
.ws-card__title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.ws-card__text {
  margin: 0;
  opacity: 0.7;
}
.ws-recap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
.ws-recap__live,
.ws-recap__file {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgb(var(--fui-theme-primary));
  text-decoration: none;
  font-size: 0.9rem;
  word-break: break-all;
}
.ws-recap__file {
  opacity: 0.8;
  font-size: 0.85rem;
}
.ws__footer {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.ws__loading {
  opacity: 0.6;
}
</style>
