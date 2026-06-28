<script setup lang="ts">
import { fetchAttemptResult } from '~/lib/exams'

definePageMeta({ layout: 'app', middleware: 'role', requiresRole: 'student' })

const route = useRoute()
const attemptId = route.params.attemptId as string

const { data: result } = await useAsyncData(`result-${attemptId}`, () => fetchAttemptResult(attemptId))
useHead({ title: () => (result.value ? `${result.value.examTitle} — Result` : 'Result') })

const r = computed(() => result.value)
const gradeLabel: Record<string, string> = {
  distinction: 'Distinction', merit: 'Merit', pass: 'Pass', fail: 'Fail',
}
const selectedSet = (ids?: string[] | null) => new Set(ids ?? [])
</script>

<template>
  <div v-if="r" class="rs">
    <NuxtLink :to="`/skill-tests/exam/${r.examId}`" class="rs__back"><f-icon icon="arrow-left" /> {{ r.examTitle }}</NuxtLink>

    <div class="rs__hero" :class="r.passed ? 'is-pass' : 'is-fail'">
      <div class="rs__score">{{ Math.round(r.scorePct ?? 0) }}%</div>
      <div class="rs__meta">
        <strong class="rs__grade">{{ gradeLabel[r.grade ?? ''] ?? r.grade }}</strong>
        <span>{{ r.passed ? 'Passed' : 'Not passed' }} · {{ r.scorePoints }}/{{ r.totalPoints }} points</span>
        <span class="rs__skill">{{ r.skillName }} · {{ r.level }}</span>
      </div>
    </div>

    <NuxtLink v-if="r.passed && r.certificateCode" :to="`/certificates/${r.certificateCode}`" class="rs__cert">
      <f-icon icon="award" /> View your certificate
    </NuxtLink>

    <h2 class="rs__h2">Review</h2>
    <div class="rs__list">
      <div v-for="(a, i) in r.answers" :key="a.questionId" class="rs__q" :class="a.isCorrect ? 'is-ok' : 'is-bad'">
        <div class="rs__q-top">
          <f-icon :icon="a.isCorrect ? 'check-circle' : 'x-circle'" />
          <strong>Q{{ i + 1 }}</strong>
          <span class="rs__pts">{{ a.awardedPoints }}/{{ a.points }} pt</span>
        </div>
        <p class="rs__prompt">{{ a.prompt }}</p>

        <div v-if="a.options && a.options.length" class="rs__opts">
          <span
            v-for="o in a.options"
            :key="o.id"
            class="rs__opt"
            :class="{
              'rs__opt--correct': a.correctOptionIds?.includes(o.id),
              'rs__opt--wrong': selectedSet(a.selectedOptionIds).has(o.id) && !a.correctOptionIds?.includes(o.id),
            }"
          >
            <f-icon v-if="a.correctOptionIds?.includes(o.id)" icon="check" />
            <f-icon v-else-if="selectedSet(a.selectedOptionIds).has(o.id)" icon="x" />
            {{ o.text }}
          </span>
        </div>
        <div v-else class="rs__free">
          <p class="rs__free-lbl">Your answer</p>
          <p class="rs__free-ans">{{ a.textAnswer || '—' }}</p>
          <p v-if="a.feedback" class="rs__fb"><f-icon icon="message-square" /> {{ a.feedback }}</p>
        </div>

        <p v-if="a.explanation" class="rs__exp">{{ a.explanation }}</p>
      </div>
    </div>
  </div>
  <p v-else class="st__empty">Result not found.</p>
</template>

<style scoped>
.rs {
  max-width: 720px;
  margin: 0 auto;
}
.rs__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  opacity: 0.7;
  margin-bottom: 16px;
}
.rs__hero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 28px;
  border-radius: 20px;
  color: #fff;
}
.rs__hero.is-pass { background: linear-gradient(135deg, #059669, #047857); }
.rs__hero.is-fail { background: linear-gradient(135deg, #6b7280, #4b5563); }
.rs__score {
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}
.rs__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rs__grade {
  font-size: 1.3rem;
}
.rs__skill {
  opacity: 0.85;
  text-transform: capitalize;
}
.rs__cert {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px 20px;
  border-radius: 999px;
  background: rgba(var(--fui-theme-primary), 0.12);
  color: rgb(var(--fui-theme-primary));
  font-weight: 700;
  text-decoration: none;
}
.rs__h2 {
  margin: 30px 0 12px;
  font-size: 1.05rem;
}
.rs__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rs__q {
  padding: 18px;
  border-radius: 14px;
  background: rgb(var(--fui-theme-surface));
  border: 1px solid rgba(var(--fui-theme-on-surface), 0.08);
  border-left: 4px solid transparent;
}
.rs__q.is-ok { border-left-color: #10b981; }
.rs__q.is-bad { border-left-color: #e5484d; }
.rs__q-top {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}
.rs__pts {
  margin-left: auto;
  opacity: 0.6;
}
.rs__prompt {
  margin: 8px 0 12px;
  font-weight: 600;
}
.rs__opts {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.rs__opt {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(var(--fui-theme-on-surface), 0.04);
  font-size: 0.9rem;
}
.rs__opt--correct { background: rgba(16, 185, 129, 0.16); color: #047857; }
.rs__opt--wrong { background: rgba(229, 72, 77, 0.14); color: #b91c1c; }
.rs__free-lbl {
  font-size: 0.78rem;
  opacity: 0.55;
  margin: 0 0 2px;
}
.rs__free-ans {
  margin: 0;
  white-space: pre-wrap;
}
.rs__fb {
  display: flex;
  gap: 6px;
  margin: 10px 0 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(var(--fui-theme-primary), 0.08);
  font-size: 0.88rem;
}
.rs__exp {
  margin: 12px 0 0;
  padding-top: 10px;
  border-top: 1px solid rgba(var(--fui-theme-on-surface), 0.08);
  font-size: 0.88rem;
  opacity: 0.75;
}
</style>
