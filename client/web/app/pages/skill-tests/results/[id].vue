<script setup lang="ts">
import { useAssessment } from '~/composables/use-skill-assessments'

definePageMeta({ layout: 'app', middleware: 'role', requiresRole: 'student' })

const route = useRoute()
const id = computed(() => route.params.id as string)
const { data: assessment, isPending, suspense } = useAssessment(() => id.value)
onServerPrefetch(() => suspense().catch(() => {}))

const score = computed(() => assessment.value?.score ?? 0)
const passed = computed(() => score.value >= 70)
const ring = computed(() => (passed.value ? 'success' : score.value >= 40 ? 'warning' : 'danger'))
</script>

<template>
  <div v-if="assessment" class="rs">
    <div class="rs__badge" :style="{ '--ring': `rgb(var(--fui-theme-${ring}))` }">
      <span class="rs__score">{{ score }}<small>%</small></span>
    </div>
    <h1 class="rs__title">{{ passed ? 'Passed!' : 'Keep practicing' }}</h1>
    <p class="rs__meta">
      {{ assessment.category }} · <f-chip :color="ring">{{ assessment.level }}</f-chip>
    </p>
    <p class="rs__sub">
      Your skill level for <strong>{{ assessment.category }}</strong> is now
      <strong>{{ assessment.level }}</strong>.
    </p>
    <div class="rs__actions">
      <f-btn color="primary" @click="navigateTo('/skill-tests')">Back to tests</f-btn>
      <f-btn variant="text" @click="navigateTo('/projects')">Browse projects</f-btn>
    </div>
  </div>

  <p v-else-if="isPending" class="rs__loading">Loading result…</p>
  <EmptyState v-else title="Result not found" text="This assessment may not exist." />
</template>

<style scoped>
.rs {
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
  padding-top: 24px;
}
.rs__badge {
  width: 140px;
  height: 140px;
  border-radius: 9999px;
  display: grid;
  place-items: center;
  border: 6px solid var(--ring);
  animation: pop 0.4s ease;
}
@media (prefers-reduced-motion: reduce) {
  .rs__badge {
    animation: none;
  }
}
@keyframes pop {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
.rs__score {
  font-size: 2.4rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.rs__score small {
  font-size: 1.2rem;
  opacity: 0.6;
}
.rs__title {
  margin: 4px 0 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.rs__meta {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.rs__sub {
  margin: 0;
  opacity: 0.7;
}
.rs__actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}
.rs__loading {
  opacity: 0.6;
}
</style>
