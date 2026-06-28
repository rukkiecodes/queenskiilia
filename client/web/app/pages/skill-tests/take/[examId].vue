<script setup lang="ts">
import { fetchActiveAttempt, saveAnswer, submitAttempt, type TakingQuestion } from '~/lib/exams'

definePageMeta({ layout: 'app', middleware: 'role', requiresRole: 'student' })
useHead({ title: 'Taking exam' })

const route = useRoute()
const examId = route.params.examId as string

const { data: attempt } = await useAsyncData(`take-${examId}`, () => fetchActiveAttempt(examId))
if (!attempt.value) await navigateTo(`/skill-tests/exam/${examId}`)

const questions = computed<TakingQuestion[]>(() => attempt.value?.questions ?? [])

// Answer state, seeded from any saved answers (resume-safe).
const answers = reactive<Record<string, { optionIds: string[]; text: string }>>({})
if (attempt.value) {
  for (const q of attempt.value.questions) answers[q.id] = { optionIds: [], text: '' }
  for (const s of attempt.value.savedAnswers) {
    answers[s.questionId] = { optionIds: s.selectedOptionIds ?? [], text: s.textAnswer ?? '' }
  }
}

const current = ref(0)
const q = computed(() => questions.value[current.value])

// ── Timer (server-authoritative expiry) ──────────────────────────
const remaining = ref(0)
let timer: any = null
const mmss = computed(() => {
  const m = Math.floor(remaining.value / 60)
  const s = remaining.value % 60
  return `${m}:${String(s).padStart(2, '0')}`
})
onMounted(() => {
  if (!attempt.value) return
  const tick = () => {
    remaining.value = Math.max(0, Math.floor((new Date(attempt.value!.expiresAt).getTime() - Date.now()) / 1000))
    if (remaining.value <= 0) {
      clearInterval(timer)
      doSubmit()
    }
  }
  tick()
  timer = setInterval(tick, 1000)
})
onBeforeUnmount(() => clearInterval(timer))

// ── Autosave ─────────────────────────────────────────────────────
const saveTimers: Record<string, any> = {}
function persist(qid: string) {
  const a = answers[qid]
  if (!attempt.value || !a) return
  saveAnswer(attempt.value.id, qid, a.optionIds, a.text || undefined).catch(() => {})
}
function selectOption(question: TakingQuestion, optId: string) {
  const a = answers[question.id]
  if (question.type === 'multiple') {
    a.optionIds = a.optionIds.includes(optId) ? a.optionIds.filter((i) => i !== optId) : [...a.optionIds, optId]
  } else {
    a.optionIds = [optId]
  }
  persist(question.id)
}
function onText(qid: string) {
  clearTimeout(saveTimers[qid])
  saveTimers[qid] = setTimeout(() => persist(qid), 600)
}

const isObjective = (t: string) => ['single', 'multiple', 'boolean'].includes(t)
const answeredCount = computed(
  () => questions.value.filter((qq) => {
    const a = answers[qq.id]
    return a && (a.optionIds.length > 0 || a.text.trim().length > 0)
  }).length,
)

// ── Submit ───────────────────────────────────────────────────────
const confirmOpen = ref(false)
const submitting = ref(false)
async function doSubmit() {
  if (submitting.value || !attempt.value) return
  submitting.value = true
  for (const qq of questions.value) persist(qq.id)
  try {
    const res = await submitAttempt(attempt.value.id)
    clearInterval(timer)
    await navigateTo(`/skill-tests/result/${res.id}`)
  } catch {
    submitting.value = false
    confirmOpen.value = false
  }
}
</script>

<template>
  <div v-if="attempt && q" class="rn">
    <div class="rn__bar">
      <span class="rn__progress">Question {{ current + 1 }} / {{ questions.length }}</span>
      <span class="rn__timer" :class="{ 'rn__timer--low': remaining < 60 }"><f-icon icon="clock" /> {{ mmss }}</span>
    </div>
    <div class="rn__track">
      <span v-for="(qq, i) in questions" :key="qq.id" class="rn__dot" :class="{ 'is-on': i === current, 'is-done': answers[qq.id]?.optionIds.length || answers[qq.id]?.text.trim() }" @click="current = i" />
    </div>

    <div class="rn__card">
      <span class="ad__tag">{{ q.points }} pt</span>
      <h2 class="rn__prompt">{{ q.prompt }}</h2>
      <img v-if="q.imageUrl" :src="q.imageUrl" alt="" class="rn__img" />
      <pre v-if="q.codeSnippet" class="rn__code">{{ q.codeSnippet }}</pre>

      <div v-if="isObjective(q.type)" class="rn__opts">
        <button
          v-for="o in q.options"
          :key="o.id"
          class="rn__opt"
          :class="{ 'rn__opt--on': answers[q.id]?.optionIds.includes(o.id) }"
          @click="selectOption(q, o.id)"
        >
          <span class="rn__mark" :class="{ 'rn__mark--radio': q.type !== 'multiple' }">
            <f-icon v-if="answers[q.id]?.optionIds.includes(o.id)" icon="check" />
          </span>
          {{ o.text }}
        </button>
      </div>
      <f-textarea
        v-else
        v-model="answers[q.id].text"
        :label="q.type === 'code' ? 'Your code' : 'Your answer'"
        :rows="q.type === 'code' ? 8 : 4"
        @update:model-value="onText(q.id)"
      />
    </div>

    <div class="rn__nav">
      <f-btn variant="outlined" :disabled="current === 0" @click="current--">Previous</f-btn>
      <span class="rn__count">{{ answeredCount }} / {{ questions.length }} answered</span>
      <f-btn v-if="current < questions.length - 1" color="primary" @click="current++">Next</f-btn>
      <f-btn v-else color="primary" @click="confirmOpen = true">Submit exam</f-btn>
    </div>

    <f-dialog v-model="confirmOpen" blur :width="420">
      <template #header><h3 style="margin: 0">Submit exam?</h3></template>
      <p style="margin: 0; opacity: 0.8">
        You've answered <strong>{{ answeredCount }}</strong> of {{ questions.length }} questions.
        You can't change your answers after submitting.
      </p>
      <template #footer>
        <f-btn variant="text" @click="confirmOpen = false">Keep going</f-btn>
        <f-btn color="primary" :loading="submitting" @click="doSubmit">Submit</f-btn>
      </template>
    </f-dialog>
  </div>
  <p v-else class="st__empty">Loading…</p>
</template>

<style scoped>
.rn {
  max-width: 720px;
  margin: 0 auto;
}
.rn__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.rn__progress {
  font-weight: 600;
  opacity: 0.7;
}
.rn__timer {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(var(--fui-theme-on-surface), 0.06);
}
.rn__timer--low {
  background: rgba(229, 72, 77, 0.16);
  color: #b91c1c;
}
.rn__track {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 18px;
}
.rn__dot {
  width: 22px;
  height: 6px;
  border-radius: 3px;
  background: rgba(var(--fui-theme-on-surface), 0.14);
  cursor: pointer;
}
.rn__dot.is-done {
  background: rgba(var(--fui-theme-primary), 0.5);
}
.rn__dot.is-on {
  background: rgb(var(--fui-theme-primary));
}
.rn__card {
  padding: 26px;
  border-radius: 18px;
  background: rgb(var(--fui-theme-surface));
  border: 1px solid rgba(var(--fui-theme-on-surface), 0.08);
}
.rn__prompt {
  margin: 10px 0 16px;
  font-size: 1.2rem;
  line-height: 1.4;
}
.rn__img {
  max-width: 100%;
  border-radius: 10px;
  margin-bottom: 14px;
}
.rn__code {
  background: rgba(var(--fui-theme-on-surface), 0.06);
  padding: 14px;
  border-radius: 10px;
  overflow-x: auto;
  font-size: 0.85rem;
  margin: 0 0 14px;
}
.rn__opts {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rn__opt {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1.5px solid rgba(var(--fui-theme-on-surface), 0.12);
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  font-size: 0.96rem;
}
.rn__opt--on {
  border-color: rgb(var(--fui-theme-primary));
  background: rgba(var(--fui-theme-primary), 0.08);
}
.rn__mark {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 6px;
  border: 1.5px solid rgba(var(--fui-theme-on-surface), 0.3);
  display: grid;
  place-items: center;
  color: #fff;
}
.rn__mark--radio {
  border-radius: 50%;
}
.rn__opt--on .rn__mark {
  background: rgb(var(--fui-theme-primary));
  border-color: rgb(var(--fui-theme-primary));
}
.rn__nav {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
}
.rn__count {
  margin: 0 auto;
  font-size: 0.86rem;
  opacity: 0.6;
}
</style>
