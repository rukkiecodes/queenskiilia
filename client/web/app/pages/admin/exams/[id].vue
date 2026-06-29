<script setup lang="ts">
import QuestionEditor from '~/components/admin/question-editor.vue'
import {
  fetchAdminExam,
  generateExamQuestions,
  fixExamAnswers,
  deleteQuestion,
  reorderQuestions,
  publishExam,
  archiveExam,
  type ExamQuestion,
} from '~/lib/admin-exams'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const examId = route.params.id as string
const { data: exam, refresh } = await useAsyncData(`exam-${examId}`, () => fetchAdminExam(examId))
useSeoMeta({ title: () => `Admin — ${exam.value?.title ?? 'Exam'}` })

const editorOpen = ref(false)
const editing = ref<ExamQuestion | null>(null)
function openAdd() {
  editing.value = null
  editorOpen.value = true
}
function openEdit(q: ExamQuestion) {
  editing.value = q
  editorOpen.value = true
}

const genCount = ref(5)
const generating = ref(false)
const genError = ref('')
async function generate() {
  generating.value = true
  genError.value = ''
  try {
    await generateExamQuestions(examId, Math.min(Math.max(genCount.value, 1), 20))
    await refresh()
  } catch (e: any) {
    genError.value = e?.message || 'Generation failed'
  } finally {
    generating.value = false
  }
}

// Objective questions the AI left without a marked correct answer.
const missingAnswers = computed(
  () =>
    (exam.value?.questions ?? []).filter(
      (q) =>
        ['single', 'multiple', 'boolean'].includes(q.type) &&
        (!q.correctOptionIds || q.correctOptionIds.length === 0),
    ).length,
)
const fixing = ref(false)
async function fixAnswers() {
  fixing.value = true
  genError.value = ''
  try {
    await fixExamAnswers(examId)
    await refresh()
  } catch (e: any) {
    genError.value = e?.message || 'Could not fix answers'
  } finally {
    fixing.value = false
  }
}

const busyId = ref<string | null>(null)
async function del(q: ExamQuestion) {
  busyId.value = q.id
  try {
    await deleteQuestion(q.id)
    await refresh()
  } finally {
    busyId.value = null
  }
}
async function move(idx: number, dir: number) {
  const qs = exam.value?.questions ?? []
  const j = idx + dir
  if (j < 0 || j >= qs.length) return
  const ids = qs.map((q) => q.id)
  ;[ids[idx], ids[j]] = [ids[j], ids[idx]]
  await reorderQuestions(examId, ids)
  await refresh()
}

const publishing = ref(false)
const banner = ref('')
const bannerErr = ref(false)
async function publish() {
  publishing.value = true
  banner.value = ''
  try {
    await publishExam(examId)
    await refresh()
    banner.value = 'Published — talents can now take this exam.'
    bannerErr.value = false
  } catch (e: any) {
    banner.value = e?.message || 'Publish failed'
    bannerErr.value = true
  } finally {
    publishing.value = false
  }
}
async function archive() {
  await archiveExam(examId)
  await refresh()
}

const TYPE_LABEL: Record<string, string> = {
  single: 'Single', multiple: 'Multi', boolean: 'True/False', short_answer: 'Short answer', code: 'Code',
}
const isObjective = (t: string) => ['single', 'multiple', 'boolean'].includes(t)
</script>

<template>
  <div v-if="exam">
    <NuxtLink to="/admin/exams" class="ad__meta xback"><f-icon icon="arrow-left" /> All exams</NuxtLink>

    <div class="xh">
      <div>
        <h1 class="ad__title">{{ exam.title }}</h1>
        <p class="ad__sub">
          {{ exam.skillName }} · {{ exam.level }} ·
          <span class="ad__status" :class="exam.status === 'published' ? 'ad__status--approved' : exam.status === 'archived' ? 'ad__status--rejected' : 'ad__status--pending'">{{ exam.status }}</span>
        </p>
      </div>
      <div class="xh__actions">
        <f-btn v-if="exam.status !== 'archived'" variant="outlined" size="small" @click="archive">Archive</f-btn>
        <f-btn v-if="exam.status !== 'published'" color="primary" :loading="publishing" @click="publish">Publish</f-btn>
      </div>
    </div>

    <p v-if="banner" class="ad__error" :style="{ background: bannerErr ? '' : 'rgba(16,185,129,0.12)', color: bannerErr ? '' : '#047857' }">{{ banner }}</p>

    <div class="xstats">
      <span><strong>{{ exam.questionCount }}</strong> questions</span>
      <span><strong>{{ exam.totalPoints }}</strong> points</span>
      <span>pass <strong>{{ exam.passThreshold }}%</strong></span>
      <span><strong>{{ exam.durationMinutes }}</strong> min</span>
    </div>

    <!-- AI generate -->
    <div class="xgen">
      <f-icon icon="zap" class="xgen__icon" />
      <span>Generate</span>
      <f-input v-model.number="genCount" type="number" style="width: 80px" />
      <span>questions with AI</span>
      <f-btn color="primary" size="small" :loading="generating" @click="generate">Generate</f-btn>
      <f-btn variant="text" size="small" prepend-icon="plus" @click="openAdd">Add manually</f-btn>
    </div>
    <p v-if="genError" class="ad__error">{{ genError }}</p>

    <div v-if="missingAnswers > 0" class="xfix">
      <f-icon icon="alert-triangle" />
      <span>
        {{ missingAnswers }} {{ missingAnswers > 1 ? 'questions have' : 'question has' }} no correct
        answer marked — you can't publish until they're fixed.
      </span>
      <f-btn color="primary" size="small" :loading="fixing" @click="fixAnswers">Fix answers with AI</f-btn>
    </div>

    <!-- Questions -->
    <p v-if="!exam.questions?.length" class="ad__empty">No questions yet — generate or add some.</p>
    <div v-else class="ad__list">
      <div v-for="(q, idx) in exam.questions" :key="q.id" class="ad__row qcard">
        <div class="qcard__reorder">
          <button :disabled="idx === 0" @click="move(idx, -1)"><f-icon icon="chevron-up" /></button>
          <button :disabled="idx === exam.questions.length - 1" @click="move(idx, 1)"><f-icon icon="chevron-down" /></button>
        </div>
        <div class="qcard__body">
          <div class="qcard__top">
            <span class="ad__tag">{{ TYPE_LABEL[q.type] }}</span>
            <span class="ad__tag">{{ q.points }} pt</span>
            <span v-if="q.aiGenerated" class="ad__tag" style="color: rgb(var(--fui-theme-primary))">AI</span>
            <span
              v-if="isObjective(q.type) && (!q.correctOptionIds || !q.correctOptionIds.length)"
              class="qcard__noans"
            >⚠ no answer</span>
          </div>
          <strong class="qcard__prompt">{{ q.prompt }}</strong>
          <div v-if="isObjective(q.type)" class="qcard__opts">
            <span v-for="o in q.options" :key="o.id" class="qcard__opt" :class="{ 'qcard__opt--ok': q.correctOptionIds?.includes(o.id) }">
              <f-icon v-if="q.correctOptionIds?.includes(o.id)" icon="check" /> {{ o.text }}
            </span>
          </div>
          <span v-else class="ad__meta">AI-graded · model answer {{ q.modelAnswer ? 'set' : 'missing' }}</span>
        </div>
        <div class="qcard__actions">
          <f-btn size="small" variant="text" @click="openEdit(q)">Edit</f-btn>
          <f-btn size="small" variant="text" color="danger" :loading="busyId === q.id" @click="del(q)">Delete</f-btn>
        </div>
      </div>
    </div>

    <QuestionEditor v-model="editorOpen" :exam-id="examId" :question="editing" @saved="refresh" />
  </div>
  <p v-else class="ad__empty">Loading…</p>
</template>

<style scoped>
.xback {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  margin-bottom: 12px;
}
.xh {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.xh__actions {
  display: flex;
  gap: 8px;
}
.xstats {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin: 6px 0 20px;
  font-size: 0.9rem;
  opacity: 0.8;
}
.xgen {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 14px;
  background: rgba(var(--fui-theme-primary), 0.08);
  border: 1px solid rgba(var(--fui-theme-primary), 0.2);
  margin-bottom: 16px;
  font-size: 0.92rem;
}
.xgen__icon {
  color: rgb(var(--fui-theme-primary));
}
.xfix {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 18px;
  border-radius: 12px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #b45309;
  margin-bottom: 16px;
  font-size: 0.9rem;
}
.xfix span {
  flex: 1;
  min-width: 200px;
}
.qcard__noans {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 8px;
  font-size: 0.74rem;
  font-weight: 700;
  background: rgba(245, 158, 11, 0.18);
  color: #b45309;
}
.qcard {
  align-items: flex-start;
  gap: 12px;
}
.qcard__reorder {
  display: flex;
  flex-direction: column;
}
.qcard__reorder button {
  background: transparent;
  border: 0;
  color: rgba(var(--fui-theme-on-surface), 0.4);
  cursor: pointer;
  padding: 2px;
}
.qcard__reorder button:disabled {
  opacity: 0.2;
  cursor: default;
}
.qcard__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.qcard__top {
  display: flex;
  gap: 6px;
}
.qcard__prompt {
  font-weight: 600;
}
.qcard__opts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.qcard__opt {
  font-size: 0.82rem;
  padding: 2px 10px;
  border-radius: 8px;
  background: rgba(var(--fui-theme-on-surface), 0.06);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.qcard__opt--ok {
  background: rgba(16, 185, 129, 0.16);
  color: #047857;
}
.qcard__actions {
  display: flex;
  flex-direction: column;
}
</style>
