<script setup lang="ts">
import { formatDistanceToNowStrict } from 'date-fns'
import { useAuthStore } from '~/stores/auth'
import type { Project } from '~/types/project'

const props = defineProps<{ project: Project }>()
const auth = useAuthStore()

// Open projects have no fixed deadline yet — show the delivery window instead.
const deadline = computed(() => {
  const p = props.project
  if (!p.deadline) return p.durationDays ? `${p.durationDays}-day delivery` : 'Flexible'
  const d = new Date(p.deadline)
  return Number.isNaN(d.getTime())
    ? `Due ${p.deadline}`
    : `Due ${formatDistanceToNowStrict(d, { addSuffix: true })}`
})
const budget = computed(() => `${props.project.currency} ${props.project.budget.toLocaleString()}`)
const cover = computed(() => props.project.thumbnailUrl || '/default-project.jpg')

const employer = computed(() => {
  const b = props.project.business
  if (!b) return null
  const name = b.businessProfile?.companyName || b.fullName || 'Employer'
  return { name, avatar: b.avatarUrl || undefined, initial: name.charAt(0).toUpperCase() }
})

// Apply: signed-in talent goes to the project (to apply); a visitor is sent to
// sign up first, then bounced back to the project.
function onApply() {
  const to = `/projects/${props.project.id}`
  if (!auth.isAuthenticated) {
    navigateTo(`/onboarding?redirect=${encodeURIComponent(to)}`)
    return
  }
  navigateTo(to)
}
</script>

<template>
  <f-card type="9" class="job-card">
    <template #img>
      <img :src="cover" :alt="project.title" loading="lazy" class="job-card__cover" />
    </template>

    <template #title>
      <h3 class="job-card__title">{{ project.title }}</h3>
    </template>

    <template #text>
      <div v-if="employer" class="job-card__employer">
        <f-avatar :image="employer.avatar" :text="employer.initial" :size="26" circle />
        <span class="job-card__employer-name">{{ employer.name }}</span>
      </div>

      <p class="job-card__desc">{{ project.description }}</p>

      <div v-if="project.requiredSkills.length" class="job-card__skills">
        <f-chip v-for="s in project.requiredSkills.slice(0, 3)" :key="s">{{ s }}</f-chip>
        <span v-if="project.requiredSkills.length > 3" class="job-card__more">
          +{{ project.requiredSkills.length - 3 }}
        </span>
      </div>

      <div class="job-card__meta">
        <span class="job-card__budget">{{ budget }}</span>
        <span class="job-card__deadline">{{ deadline }}</span>
      </div>
    </template>

    <template #buttons>
      <f-btn color="primary" block @click="onApply">Apply now</f-btn>
    </template>
  </f-card>
</template>

<style scoped>
.job-card {
  width: 100%;
}
.job-card__cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.job-card__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.job-card__employer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0 12px;
}
.job-card__employer-name {
  font-size: 0.85rem;
  font-weight: 600;
  opacity: 0.82;
}
.job-card__desc {
  margin: 0 0 12px;
  opacity: 0.7;
  font-size: 0.9rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.job-card__skills {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
}
.job-card__more {
  font-size: 0.8rem;
  opacity: 0.6;
}
.job-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}
.job-card__budget {
  color: rgb(var(--fui-theme-primary));
}
.job-card__deadline {
  opacity: 0.7;
}
</style>
