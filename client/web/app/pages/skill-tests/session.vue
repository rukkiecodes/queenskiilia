<script setup lang="ts">
import { useActiveSession, useSubmitAssessment } from '~/composables/use-skill-assessments'
import { useCountdown } from '~/composables/use-countdown'

definePageMeta({ layout: 'app', middleware: 'role', requiresRole: 'student' })

const { data: session, isPending } = useActiveSession()
const answers = ref<Record<number, number>>({})
const submitted = ref(false)
const { mutate: submitAssessment, isPending: submitting } = useSubmitAssessment()

function doSubmit() {
  if (!session.value || submitted.value) return
  submitted.value = true
  const payload = session.value.questions.map((q) => ({
    questionIndex: q.index,
    selectedOption: answers.value[q.index] ?? -1,
  }))
  submitAssessment(
    { sessionId: session.value.id, answers: payload },
    {
      onSuccess: (a) => navigateTo(`/skill-tests/results/${a.id}`),
      onError: () => {
        submitted.value = false
      },
    },
  )
}

const { label: timeLabel, secondsLeft } = useCountdown(
  () => session.value?.expiresAt ?? null,
  () => doSubmit(),
)
const answeredCount = computed(() => Object.keys(answers.value).length)

function select(qi: number, oi: number) {
  answers.value = { ...answers.value, [qi]: oi }
}

// No active session (e.g. direct visit) → back to the index.
watch(
  [isPending, session],
  ([pending, s]) => {
    if (!pending && !s) navigateTo('/skill-tests')
  },
  { immediate: true },
)
</script>

<template>
  <ClientOnly>
    <div v-if="session" class="se">
      <header class="se__bar">
        <span class="se__cat">{{ session.category }}</span>
        <span class="se__time" :class="{ 'se__time--low': secondsLeft < 30 }">{{ timeLabel }}</span>
        <span class="se__prog">{{ answeredCount }}/{{ session.questions.length }}</span>
      </header>

      <ol class="se__qs">
        <li v-for="q in session.questions" :key="q.index" class="se__q">
          <p class="se__qtext">{{ q.index + 1 }}. {{ q.text }}</p>
          <div class="se__opts">
            <label
              v-for="(opt, oi) in q.options"
              :key="oi"
              class="se__opt"
              :class="{ 'se__opt--on': answers[q.index] === oi }"
            >
              <input
                type="radio"
                :name="`q-${q.index}`"
                :checked="answers[q.index] === oi"
                @change="select(q.index, oi)"
              />
              <span>{{ opt }}</span>
            </label>
          </div>
        </li>
      </ol>

      <f-btn color="primary" block size="large" :loading="submitting" @click="doSubmit">Submit test</f-btn>
    </div>

    <p v-else-if="isPending" class="se__loading">Loading your test…</p>

    <template #fallback>
      <p class="se__loading">Loading…</p>
    </template>
  </ClientOnly>
</template>

<style scoped>
.se {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.se__bar {
  position: sticky;
  top: 64px;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--fui-radius-md);
  background: rgb(var(--fui-theme-surface));
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
}
.se__cat {
  font-weight: 600;
}
.se__time {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: rgb(var(--fui-theme-primary));
}
.se__time--low {
  color: rgb(var(--fui-theme-danger));
}
.se__prog {
  opacity: 0.6;
  font-size: 0.85rem;
}
.se__qs {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.se__q {
  padding: 18px;
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  border-radius: var(--fui-radius-lg);
  background: rgb(var(--fui-theme-surface));
}
.se__qtext {
  margin: 0 0 12px;
  font-weight: 600;
}
.se__opts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.se__opt {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--fui-radius-md);
  border: 1px solid rgba(var(--fui-theme-on-background), 0.12);
  cursor: pointer;
}
.se__opt--on {
  border-color: rgb(var(--fui-theme-primary));
  background: rgba(var(--fui-theme-primary), 0.06);
}
.se__loading {
  opacity: 0.6;
}
</style>
