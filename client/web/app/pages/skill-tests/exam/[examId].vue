<script setup lang="ts">
import { fetchPublishedExams, fetchMyAttempts, startAttempt, type Attempt } from '~/lib/exams'

definePageMeta({ layout: 'app', middleware: 'role', requiresRole: 'student' })

const route = useRoute()
const examId = route.params.examId as string

const { data } = await useAsyncData(`exam-detail-${examId}`, async () => {
  const [exams, attempts] = await Promise.all([fetchPublishedExams(), fetchMyAttempts(examId)])
  return { exam: exams.find((e) => e.id === examId) ?? null, attempts }
})
useHead({ title: () => data.value?.exam?.title ?? 'Exam' })

const exam = computed(() => data.value?.exam ?? null)
const attempts = computed<Attempt[]>(() => data.value?.attempts ?? [])
const active = computed(() => attempts.value.find((a) => a.status === 'in_progress'))
const used = computed(() => attempts.value.filter((a) => a.status === 'graded' || a.status === 'submitted').length)
const remaining = computed(() => Math.max((exam.value?.maxAttempts ?? 0) - used.value, 0))
const passed = computed(() => attempts.value.some((a) => a.passed))

const starting = ref(false)
const error = ref('')
async function start() {
  starting.value = true
  error.value = ''
  try {
    await startAttempt(examId)
    await navigateTo(`/skill-tests/take/${examId}`)
  } catch (e: any) {
    error.value = e?.message || 'Could not start the exam'
    starting.value = false
  }
}

const fmtPct = (n?: number | null) => (n == null ? '—' : `${Math.round(n)}%`)
</script>

<template>
  <div v-if="exam" class="ed">
    <NuxtLink to="/skill-tests" class="ed__back"><f-icon icon="arrow-left" /> Skill tests</NuxtLink>

    <span class="ed__lv">{{ exam.level }}</span>
    <h1 class="ed__title">{{ exam.title }}</h1>
    <p class="ed__skill">{{ exam.skillName }}</p>
    <p v-if="exam.description" class="ed__desc">{{ exam.description }}</p>

    <div class="ed__facts">
      <div><span>Questions</span><strong>{{ exam.questionCount }}</strong></div>
      <div><span>Duration</span><strong>{{ exam.durationMinutes }} min</strong></div>
      <div><span>Pass mark</span><strong>{{ exam.passThreshold }}%</strong></div>
      <div><span>Attempts left</span><strong>{{ remaining }} / {{ exam.maxAttempts }}</strong></div>
    </div>

    <div class="ed__cta">
      <f-btn v-if="active" color="primary" size="large" :loading="starting" @click="start">Resume exam</f-btn>
      <f-btn v-else-if="remaining > 0" color="primary" size="large" :loading="starting" @click="start">
        Start exam
      </f-btn>
      <p v-else class="ed__none">No attempts remaining.</p>
      <p v-if="passed" class="ed__passed"><f-icon icon="check-circle" /> You've passed this exam.</p>
    </div>
    <p v-if="error" class="ad__error" style="max-width: 460px">{{ error }}</p>

    <template v-if="attempts.length">
      <h2 class="ed__h2">Your attempts</h2>
      <div class="ed__attempts">
        <NuxtLink
          v-for="a in attempts"
          :key="a.id"
          :to="a.status === 'graded' ? `/skill-tests/result/${a.id}` : `/skill-tests/take/${examId}`"
          class="ed__att"
        >
          <span>Attempt {{ a.attemptNumber }}</span>
          <span class="ed__att-score">{{ a.status === 'graded' ? fmtPct(a.scorePct) : 'In progress' }}</span>
          <span v-if="a.grade" class="ed__att-grade" :class="a.passed ? 'is-pass' : 'is-fail'">{{ a.grade }}</span>
          <f-icon icon="chevron-right" />
        </NuxtLink>
      </div>
    </template>
  </div>
  <p v-else class="st__empty">This exam isn't available.</p>
</template>

<style scoped>
.ed {
  max-width: 640px;
}
.ed__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  opacity: 0.7;
  margin-bottom: 16px;
}
.ed__lv {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: capitalize;
  background: rgba(var(--fui-theme-primary), 0.14);
  color: rgb(var(--fui-theme-primary));
}
.ed__title {
  margin: 10px 0 2px;
}
.ed__skill {
  opacity: 0.6;
  margin: 0;
}
.ed__desc {
  margin: 14px 0 0;
  line-height: 1.6;
  opacity: 0.85;
}
.ed__facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 14px;
  margin: 24px 0;
}
.ed__facts div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgb(var(--fui-theme-surface));
  border: 1px solid rgba(var(--fui-theme-on-surface), 0.08);
}
.ed__facts span {
  font-size: 0.78rem;
  opacity: 0.6;
}
.ed__facts strong {
  font-size: 1.15rem;
}
.ed__cta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.ed__none {
  opacity: 0.6;
}
.ed__passed {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #047857;
  font-weight: 600;
}
.ed__h2 {
  margin: 30px 0 12px;
  font-size: 1.05rem;
}
.ed__attempts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ed__att {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 12px;
  background: rgb(var(--fui-theme-surface));
  border: 1px solid rgba(var(--fui-theme-on-surface), 0.08);
  color: inherit;
  text-decoration: none;
}
.ed__att-score {
  margin-left: auto;
  font-weight: 700;
}
.ed__att-grade {
  text-transform: capitalize;
  font-size: 0.82rem;
  padding: 2px 10px;
  border-radius: 999px;
}
.is-pass { background: rgba(16, 185, 129, 0.16); color: #047857; }
.is-fail { background: rgba(229, 72, 77, 0.16); color: #b91c1c; }
</style>
