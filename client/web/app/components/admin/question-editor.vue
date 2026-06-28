<script setup lang="ts">
import FileUpload from '~/components/forms/file-upload.vue'
import { addQuestion, updateQuestion, type ExamQuestion, type QuestionInput } from '~/lib/admin-exams'

const props = defineProps<{
  modelValue: boolean
  examId: string
  question: ExamQuestion | null
}>()
const emit = defineEmits<{ 'update:modelValue': [boolean]; saved: [] }>()

const TYPES = [
  { v: 'single', l: 'Single choice' },
  { v: 'multiple', l: 'Multi-select' },
  { v: 'boolean', l: 'True / False' },
  { v: 'short_answer', l: 'Short answer' },
  { v: 'code', l: 'Code' },
]
const OBJECTIVE = ['single', 'multiple', 'boolean']

const q = reactive({
  type: 'single',
  prompt: '',
  imageUrl: '' as string | null,
  codeSnippet: '',
  codeLanguage: '',
  options: [] as { id: string; text: string }[],
  correctIds: [] as string[],
  modelAnswer: '',
  gradingRubric: '',
  expectedLanguage: '',
  explanation: '',
  points: 1,
})
const busy = ref(false)
const error = ref('')

const isObjective = computed(() => OBJECTIVE.includes(q.type))

function reset() {
  q.type = 'single'
  q.prompt = ''
  q.imageUrl = ''
  q.codeSnippet = ''
  q.codeLanguage = ''
  q.options = [
    { id: '0', text: '' },
    { id: '1', text: '' },
  ]
  q.correctIds = []
  q.modelAnswer = ''
  q.gradingRubric = ''
  q.expectedLanguage = ''
  q.explanation = ''
  q.points = 1
  error.value = ''
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    const src = props.question
    if (src) {
      q.type = src.type
      q.prompt = src.prompt
      q.imageUrl = src.imageUrl ?? ''
      q.codeSnippet = src.codeSnippet ?? ''
      q.codeLanguage = src.codeLanguage ?? ''
      q.options = (src.options ?? []).map((o) => ({ id: o.id, text: o.text }))
      q.correctIds = [...(src.correctOptionIds ?? [])]
      q.modelAnswer = src.modelAnswer ?? ''
      q.gradingRubric = src.gradingRubric ?? ''
      q.expectedLanguage = src.expectedLanguage ?? ''
      q.explanation = src.explanation ?? ''
      q.points = src.points ?? 1
      error.value = ''
    } else {
      reset()
    }
  },
)

watch(
  () => q.type,
  (t) => {
    if (t === 'boolean') {
      q.options = [
        { id: '0', text: 'True' },
        { id: '1', text: 'False' },
      ]
      q.correctIds = q.correctIds.filter((id) => id === '0' || id === '1').slice(0, 1)
    } else if (OBJECTIVE.includes(t) && q.options.length < 2) {
      q.options = [
        { id: '0', text: '' },
        { id: '1', text: '' },
      ]
    }
  },
)

function addOption() {
  q.options.push({ id: String(q.options.length ? Math.max(...q.options.map((o) => +o.id)) + 1 : 0), text: '' })
}
function removeOption(id: string) {
  q.options = q.options.filter((o) => o.id !== id)
  q.correctIds = q.correctIds.filter((c) => c !== id)
}
function toggleCorrect(id: string) {
  if (q.type === 'multiple') {
    q.correctIds = q.correctIds.includes(id) ? q.correctIds.filter((c) => c !== id) : [...q.correctIds, id]
  } else {
    q.correctIds = [id]
  }
}

async function save() {
  if (!q.prompt.trim()) {
    error.value = 'A prompt is required'
    return
  }
  const input: QuestionInput = {
    type: q.type,
    prompt: q.prompt.trim(),
    imageUrl: q.imageUrl || null,
    explanation: q.explanation || null,
    points: q.points || 1,
  }
  if (isObjective.value) {
    const opts = q.options.filter((o) => o.text.trim())
    if (opts.length < 2) {
      error.value = 'Add at least two options'
      return
    }
    if (!q.correctIds.length) {
      error.value = 'Mark the correct answer'
      return
    }
    input.options = opts.map((o) => ({ id: o.id, text: o.text.trim(), imageUrl: null }))
    input.correctOptionIds = q.correctIds.filter((id) => opts.some((o) => o.id === id))
  } else {
    if (!q.modelAnswer.trim()) {
      error.value = 'A model answer is required for grading'
      return
    }
    input.modelAnswer = q.modelAnswer.trim()
    input.gradingRubric = q.gradingRubric || null
    if (q.type === 'code') {
      input.codeSnippet = q.codeSnippet || null
      input.expectedLanguage = q.expectedLanguage || null
    }
  }

  busy.value = true
  error.value = ''
  try {
    if (props.question) await updateQuestion(props.question.id, input)
    else await addQuestion(props.examId, input)
    emit('saved')
    emit('update:modelValue', false)
  } catch (e: any) {
    error.value = e?.message || 'Save failed'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <f-dialog :model-value="modelValue" blur :width="620" @update:model-value="emit('update:modelValue', $event)">
    <template #header><h3 style="margin: 0">{{ question ? 'Edit' : 'Add' }} question</h3></template>

    <div class="qe">
      <div class="qe__types">
        <button v-for="t in TYPES" :key="t.v" class="ad__chip" :class="{ 'ad__chip--on': q.type === t.v }" @click="q.type = t.v">
          {{ t.l }}
        </button>
      </div>

      <f-textarea v-model="q.prompt" label="Question prompt" :rows="2" />

      <FileUpload v-model="q.imageUrl" folder="exam-diagrams" :max-size-mb="5" label="Diagram / image (optional)" />

      <!-- Objective options -->
      <div v-if="isObjective" class="qe__opts">
        <span class="qe__lbl">Options — mark the correct {{ q.type === 'multiple' ? 'answers' : 'answer' }}</span>
        <div v-for="o in q.options" :key="o.id" class="qe__opt">
          <button
            type="button"
            class="qe__mark"
            :class="{ 'qe__mark--on': q.correctIds.includes(o.id), 'qe__mark--radio': q.type !== 'multiple' }"
            @click="toggleCorrect(o.id)"
          >
            <f-icon v-if="q.correctIds.includes(o.id)" icon="check" />
          </button>
          <f-input v-model="o.text" :readonly="q.type === 'boolean'" :placeholder="`Option`" style="flex: 1" />
          <button v-if="q.type !== 'boolean'" type="button" class="qe__del" @click="removeOption(o.id)"><f-icon icon="x" /></button>
        </div>
        <f-btn v-if="q.type !== 'boolean'" size="small" variant="text" prepend-icon="plus" @click="addOption">Add option</f-btn>
      </div>

      <!-- AI-graded -->
      <template v-else>
        <f-textarea v-model="q.modelAnswer" label="Model answer (used for grading — hidden from talents)" :rows="2" />
        <f-textarea v-model="q.gradingRubric" label="Grading rubric (optional)" :rows="2" />
        <f-input v-if="q.type === 'code'" v-model="q.expectedLanguage" label="Expected language (e.g. javascript)" />
      </template>

      <f-textarea v-model="q.explanation" label="Explanation (shown after grading)" :rows="2" />
      <f-input v-model.number="q.points" type="number" label="Points" style="max-width: 140px" />

      <p v-if="error" class="ad__error" style="margin: 0">{{ error }}</p>
    </div>

    <template #footer>
      <f-btn variant="text" @click="emit('update:modelValue', false)">Cancel</f-btn>
      <f-btn color="primary" :loading="busy" @click="save">{{ question ? 'Save' : 'Add question' }}</f-btn>
    </template>
  </f-dialog>
</template>

<style scoped>
.qe {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.qe__types {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.qe__lbl {
  font-size: 0.82rem;
  opacity: 0.6;
}
.qe__opts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.qe__opt {
  display: flex;
  align-items: center;
  gap: 8px;
}
.qe__mark {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 8px;
  border: 1.5px solid rgba(var(--fui-theme-on-surface), 0.25);
  background: transparent;
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
}
.qe__mark--radio {
  border-radius: 50%;
}
.qe__mark--on {
  background: rgb(var(--fui-theme-primary));
  border-color: rgb(var(--fui-theme-primary));
}
.qe__del {
  background: transparent;
  border: 0;
  color: rgba(var(--fui-theme-on-surface), 0.5);
  cursor: pointer;
  padding: 6px;
}
</style>
