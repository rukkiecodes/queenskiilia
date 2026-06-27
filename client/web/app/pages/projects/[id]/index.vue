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
const canApply = computed(() => auth.isStudent && project.value?.status === 'open' && !applied.value)

const myLevel = computed(() => auth.me?.studentProfile?.skillLevel ?? null)
const levelGap = computed(() => {
  if (!project.value || !myLevel.value) return false
  const mine = SKILL_LEVELS.indexOf(myLevel.value as (typeof SKILL_LEVELS)[number])
  const required = SKILL_LEVELS.indexOf(project.value.skillLevel)
  return mine >= 0 && required >= 0 && mine < required
})

const deadline = computed(() => {
  const p = project.value
  if (!p) return ''
  if (!p.deadline) {
    return p.durationDays ? `${p.durationDays} days to deliver` : 'Flexible'
  }
  const d = new Date(p.deadline)
  return Number.isNaN(d.getTime())
    ? p.deadline
    : `Due ${format(d, 'PP')} (${formatDistanceToNowStrict(d, { addSuffix: true })})`
})

// createdAt comes back as an epoch-ms string from user-service; other dates are
// ISO. Parse either, and never hand an Invalid Date to date-fns (it throws).
function parseTimestamp(v?: string | null): Date | null {
  if (!v) return null
  const n = Number(v)
  const d = Number.isFinite(n) && String(n) === v.trim() ? new Date(n) : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

// ── Client sub-profile ───────────────────────────────────────────────────────
const client = computed(() => {
  const b = project.value?.business
  if (!b) return null
  const bp = b.businessProfile
  const name = bp?.companyName || b.fullName || 'Client'
  return {
    name,
    avatar: b.avatarUrl || undefined,
    initial: name.charAt(0).toUpperCase(),
    verified: !!b.isVerified,
    industry: bp?.industry || null,
    country: bp?.country || b.country || null,
    website: bp?.website || null,
    description: bp?.description || null,
    rating: bp?.averageRating ?? null,
    projectsPosted: bp?.totalProjectsPosted ?? 0,
    memberSince: parseTimestamp(b.createdAt),
  }
})
const websiteLabel = computed(() =>
  client.value?.website ? client.value.website.replace(/^https?:\/\//, '').replace(/\/$/, '') : '',
)

const isOwner = computed(() => !!auth.user && auth.user.id === project.value?.businessId)
const isSelectedStudent = computed(
  () => !!auth.user && auth.user.id === project.value?.selectedStudent,
)
const isActive = computed(() =>
  ['in_progress', 'under_review', 'completed', 'disputed'].includes(project.value?.status ?? ''),
)
const { mutate: cancelProject, isPending: cancelling } = useCancelProject()
const { confirm } = useConfirm()
async function onCancel() {
  if (!project.value) return
  const ok = await confirm({
    title: 'Cancel project?',
    message: 'This permanently cancels the project and cannot be undone.',
    confirmLabel: 'Cancel project',
    cancelLabel: 'Keep it',
    danger: true,
  })
  if (ok) cancelProject(project.value.id)
}

const applyOpen = ref(false)
const profileOpen = ref(false)
</script>

<template>
  <div v-if="project" class="pd">
    <button type="button" class="pd__back" @click="navigateTo('/projects')">
      <f-icon icon="arrow-left" /> Back to projects
    </button>

    <!-- ── Client sub-profile (cover + centered avatar + ratings) ───────────── -->
    <section v-if="client" class="client">
      <div class="client__cover">
        <div
          v-if="client.avatar"
          class="client__cover-img"
          :style="{ backgroundImage: `url(${client.avatar})` }"
        />
        <div v-else class="client__cover-fallback" />
      </div>

      <div class="client__body">
        <f-avatar
          class="client__avatar"
          :image="client.avatar"
          :text="client.initial"
          :size="104"
          circle
        />

        <h2 class="client__name">
          {{ client.name }}
          <f-icon v-if="client.verified" icon="badge-check" class="client__verified" />
        </h2>

        <p v-if="client.industry || client.country" class="client__tagline">
          <span v-if="client.industry">{{ client.industry }}</span>
          <span v-if="client.industry && client.country" class="client__dot">·</span>
          <span v-if="client.country">{{ client.country }}</span>
        </p>

        <!-- Ratings -->
        <div v-if="client.rating && client.rating > 0" class="client__rating">
          <span class="client__stars">
            <f-icon
              v-for="i in 5"
              :key="i"
              icon="star"
              class="client__star"
              :class="{ 'client__star--on': i <= Math.round(client.rating) }"
            />
          </span>
          <strong>{{ client.rating.toFixed(1) }}</strong>
          <span class="client__rating-sub">· {{ client.projectsPosted }} projects posted</span>
        </div>
        <div v-else class="client__rating client__rating--none">
          <f-icon icon="star" class="client__star" />
          <span>New client · {{ client.projectsPosted }} projects posted</span>
        </div>

        <div class="client__links">
          <a
            v-if="client.website"
            :href="client.website"
            target="_blank"
            rel="noopener noreferrer"
            class="client__link"
          >
            <f-icon icon="link" /> {{ websiteLabel }}
          </a>
          <span v-if="client.memberSince" class="client__since">
            <f-icon icon="calendar" /> Joined {{ format(client.memberSince, 'MMM yyyy') }}
          </span>
        </div>

        <div v-if="client.description" class="client__about-wrap">
          <p class="client__about">{{ client.description }}</p>
          <button type="button" class="client__more" @click="profileOpen = true">Read more</button>
        </div>
      </div>
    </section>

    <!-- ── Job information & specifications ─────────────────────────────────── -->
    <section class="job">
      <header class="job__head">
        <h1 class="job__title">{{ project.title }}</h1>
        <div class="job__chips">
          <f-chip color="primary">{{ project.skillLevel }}</f-chip>
          <f-chip>{{ statusLabel(project.status) }}</f-chip>
        </div>
      </header>

      <div class="job__facts">
        <div class="job__fact">
          <span class="job__fact-label">Budget</span>
          <span class="job__fact-value job__fact-value--accent">
            {{ project.currency }} {{ project.budget.toLocaleString() }}
          </span>
        </div>
        <div class="job__fact">
          <span class="job__fact-label">Delivery</span>
          <span class="job__fact-value">{{ deadline }}</span>
        </div>
        <div class="job__fact">
          <span class="job__fact-label">Skill level</span>
          <span class="job__fact-value">{{ project.skillLevel }}</span>
        </div>
      </div>

      <div class="job__block">
        <h3 class="job__legend">About this job</h3>
        <p class="job__desc">{{ project.description }}</p>
      </div>

      <div v-if="project.requiredSkills.length" class="job__block">
        <h3 class="job__legend">Required skills</h3>
        <div class="job__skills">
          <f-chip v-for="s in project.requiredSkills" :key="s">{{ s }}</f-chip>
        </div>
      </div>

      <f-alert v-if="levelGap" type="info" variant="flat" class="job__note">
        This project asks for a higher skill level than your current one — you can still apply.
      </f-alert>

      <!-- CTA -->
      <div class="job__cta">
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
          <f-btn v-if="canApply" color="primary" size="large" @click="applyOpen = true">
            Apply now
          </f-btn>
          <f-btn v-else-if="applied" color="primary" size="large" disabled>Applied</f-btn>
          <p v-else-if="project.status !== 'open'" class="job__closed">
            This project is no longer accepting applications.
          </p>
        </template>
      </div>
    </section>

    <!-- Full client profile (frosted blur dialog) -->
    <f-dialog v-model="profileOpen" blur :width="520">
      <template #header>
        <div v-if="client" class="cdlg__head">
          <f-avatar :image="client.avatar" :text="client.initial" :size="56" circle />
          <div>
            <h3 class="cdlg__name">
              {{ client.name }}
              <f-icon v-if="client.verified" icon="badge-check" class="client__verified" />
            </h3>
            <p v-if="client.industry || client.country" class="cdlg__sub">
              <span v-if="client.industry">{{ client.industry }}</span>
              <span v-if="client.industry && client.country" class="client__dot">·</span>
              <span v-if="client.country">{{ client.country }}</span>
            </p>
          </div>
        </div>
      </template>

      <div v-if="client" class="cdlg__body">
        <div v-if="client.rating && client.rating > 0" class="client__rating">
          <span class="client__stars">
            <f-icon
              v-for="i in 5"
              :key="i"
              icon="star"
              class="client__star"
              :class="{ 'client__star--on': i <= Math.round(client.rating) }"
            />
          </span>
          <strong>{{ client.rating.toFixed(1) }}</strong>
          <span class="client__rating-sub">· {{ client.projectsPosted }} projects posted</span>
        </div>
        <div v-else class="client__rating client__rating--none">
          <f-icon icon="star" class="client__star" />
          <span>New client · {{ client.projectsPosted }} projects posted</span>
        </div>

        <dl class="cdlg__facts">
          <div v-if="client.industry" class="cdlg__fact">
            <dt>Industry</dt><dd>{{ client.industry }}</dd>
          </div>
          <div v-if="client.country" class="cdlg__fact">
            <dt>Location</dt><dd>{{ client.country }}</dd>
          </div>
          <div v-if="client.website" class="cdlg__fact">
            <dt>Website</dt>
            <dd>
              <a :href="client.website" target="_blank" rel="noopener noreferrer" class="client__link">
                {{ websiteLabel }}
              </a>
            </dd>
          </div>
          <div v-if="client.memberSince" class="cdlg__fact">
            <dt>Member since</dt><dd>{{ format(client.memberSince, 'MMMM yyyy') }}</dd>
          </div>
          <div class="cdlg__fact">
            <dt>Projects posted</dt><dd>{{ client.projectsPosted }}</dd>
          </div>
          <div v-if="client.verified" class="cdlg__fact">
            <dt>Status</dt><dd>Verified client</dd>
          </div>
        </dl>

        <div v-if="client.description" class="cdlg__about">
          <h4 class="job__legend">About</h4>
          <p>{{ client.description }}</p>
        </div>
      </div>

      <template #footer>
        <f-btn color="primary" @click="profileOpen = false">Close</f-btn>
      </template>
    </f-dialog>

    <ApplyDialog v-model="applyOpen" :project-id="project.id" :project-title="project.title" />
  </div>

  <p v-else-if="isPending" class="pd__loading">Loading project…</p>
  <EmptyState v-else title="Project not found" text="This project may have been removed." />
</template>

<style scoped>
.pd {
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
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

/* ── Client sub-profile ─────────────────────────────────────────────────── */
.client {
  background: rgb(var(--fui-theme-surface));
  border: 1px solid rgba(var(--fui-theme-on-background), 0.08);
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.05);
}
.client__cover {
  position: relative;
  height: 132px;
  overflow: hidden;
}
.client__cover-img {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: blur(22px) saturate(1.1);
  transform: scale(1.4);
}
.client__cover-fallback {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgb(var(--fui-theme-primary)), rgba(var(--fui-theme-primary), 0.5));
}
.client__cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.32));
}
.client__body {
  position: relative;
  margin-top: -56px;
  padding: 0 24px 26px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.client__avatar {
  border: 4px solid rgb(var(--fui-theme-surface));
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.14);
}
.client__name {
  margin: 6px 0 0;
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.client__verified {
  color: rgb(var(--fui-theme-primary));
}
.client__tagline {
  margin: 0;
  opacity: 0.6;
  font-size: 0.92rem;
}
.client__dot {
  margin: 0 6px;
  opacity: 0.5;
}
.client__rating {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.92rem;
}
.client__stars {
  display: inline-flex;
  gap: 1px;
}
.client__star {
  color: rgba(var(--fui-theme-on-background), 0.22);
  font-size: 0.95rem;
}
.client__star--on {
  color: #f5a623;
}
.client__rating-sub,
.client__rating--none {
  opacity: 0.6;
}
.client__rating--none {
  gap: 6px;
}
.client__links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-top: 4px;
  font-size: 0.88rem;
}
.client__link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: rgb(var(--fui-theme-primary));
  text-decoration: none;
}
.client__since {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  opacity: 0.6;
}
.client__about-wrap {
  margin-top: 10px;
  max-width: 46ch;
}
.client__about {
  margin: 0;
  line-height: 1.6;
  opacity: 0.78;
  font-size: 0.94rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.client__more {
  margin-top: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgb(var(--fui-theme-primary));
  font: inherit;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
}

/* ── Client profile dialog ──────────────────────────────────────────────── */
.cdlg__head {
  display: flex;
  align-items: center;
  gap: 14px;
}
.cdlg__name {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.cdlg__sub {
  margin: 2px 0 0;
  opacity: 0.6;
  font-size: 0.9rem;
}
.cdlg__body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.cdlg__facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 18px;
  margin: 0;
}
.cdlg__fact {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.cdlg__fact dt {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.5;
}
.cdlg__fact dd {
  margin: 0;
  font-weight: 600;
  font-size: 0.92rem;
}
.cdlg__about p {
  margin: 8px 0 0;
  line-height: 1.6;
  opacity: 0.82;
  font-size: 0.92rem;
}

/* ── Job card ───────────────────────────────────────────────────────────── */
.job {
  background: rgb(var(--fui-theme-surface));
  border: 1px solid rgba(var(--fui-theme-on-background), 0.08);
  border-radius: 22px;
  padding: clamp(20px, 4vw, 32px);
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.job__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.job__title {
  margin: 0;
  font-size: clamp(1.4rem, 3vw, 1.8rem);
  font-weight: 700;
  letter-spacing: -0.025em;
}
.job__chips {
  display: flex;
  gap: 6px;
}
.job__facts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px;
  background: rgba(var(--fui-theme-on-background), 0.04);
  border-radius: 14px;
}
.job__fact {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.job__fact-label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.5;
}
.job__fact-value {
  font-weight: 600;
}
.job__fact-value--accent {
  color: rgb(var(--fui-theme-primary));
}
.job__block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.job__legend {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.55;
}
.job__desc {
  margin: 0;
  line-height: 1.65;
  white-space: pre-wrap;
  opacity: 0.85;
}
.job__skills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.job__cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.job__closed {
  opacity: 0.6;
  margin: 0;
}
.pd__loading {
  opacity: 0.6;
}
@media (max-width: 560px) {
  .job__facts {
    grid-template-columns: 1fr;
  }
}
</style>
