<script setup lang="ts">
import { SKILL_LEVELS, type SkillLevel } from '~/types/filters'
import {
  useActiveSession,
  useMyAssessments,
  useSkillCategories,
  useStartAssessment,
} from '~/composables/use-skill-assessments'

definePageMeta({ layout: 'app', middleware: 'role', requiresRole: 'student' })

const { data: categories, suspense } = useSkillCategories()
onServerPrefetch(() => suspense().catch(() => {}))

const { data: myAssessments } = useMyAssessments()
const { data: activeSession } = useActiveSession()
const { mutate: start, isPending: starting } = useStartAssessment()

const dialogOpen = ref(false)
const selectedCategory = ref<string | null>(null)
const level = ref<SkillLevel>('beginner')
const startError = ref('')

const topCategories = computed(() => (categories.value ?? []).filter((c) => !c.parentCategory))
const displayCategories = computed(() =>
  topCategories.value.length ? topCategories.value : categories.value ?? [],
)

function openStart(name: string) {
  selectedCategory.value = name
  level.value = 'beginner'
  startError.value = ''
  dialogOpen.value = true
}
function begin() {
  if (!selectedCategory.value) return
  start(
    { category: selectedCategory.value, level: level.value },
    {
      onSuccess: () => {
        dialogOpen.value = false
        navigateTo('/skill-tests/session')
      },
      onError: (e: unknown) => {
        startError.value = (e as Error)?.message ?? 'Could not start the test.'
      },
    },
  )
}

function scoreColor(s: number | null) {
  if (s == null) return undefined
  return s >= 70 ? 'success' : s >= 40 ? 'warning' : 'danger'
}
</script>

<template>
  <div class="st">
    <header>
      <h1 class="st__title">Skill tests</h1>
      <p class="st__sub">Pass a timed assessment to set your skill level and unlock higher-tier projects.</p>
    </header>

    <f-alert v-if="activeSession" type="info" variant="flat" class="st__resume">
      You have a test in progress.
      <f-btn color="primary" size="small" @click="navigateTo('/skill-tests/session')">Resume test</f-btn>
    </f-alert>

    <section v-if="myAssessments && myAssessments.length" class="st__section">
      <h2 class="st__h2">Your results</h2>
      <ul class="st__results">
        <li
          v-for="a in myAssessments"
          :key="a.id"
          class="st__result"
          @click="navigateTo(`/skill-tests/results/${a.id}`)"
        >
          <span>{{ a.category }} · {{ a.level }}</span>
          <f-chip :color="scoreColor(a.score)">{{ a.score != null ? `${a.score}%` : '—' }}</f-chip>
        </li>
      </ul>
    </section>

    <section class="st__section">
      <h2 class="st__h2">Categories</h2>
      <div class="st__grid">
        <article v-for="c in displayCategories" :key="c.id" class="st__card">
          <h3 class="st__card-title">{{ c.name }}</h3>
          <div v-if="c.skills.length" class="st__card-skills">
            <f-chip v-for="s in c.skills.slice(0, 3)" :key="s">{{ s }}</f-chip>
          </div>
          <f-btn color="primary" size="small" :disabled="!!activeSession" @click="openStart(c.name)">
            Take test
          </f-btn>
        </article>
      </div>
    </section>

    <f-dialog v-model="dialogOpen" :width="400">
      <template #header><h3>Start {{ selectedCategory }} test</h3></template>
      <f-alert v-if="startError" type="error" variant="flat" class="st__dlg-alert">{{ startError }}</f-alert>
      <f-select v-model="level" :items="[...SKILL_LEVELS]" label="Level" />
      <p class="st__note">Timed assessment — you can't pause once it starts.</p>
      <template #footer>
        <f-btn variant="text" @click="dialogOpen = false">Cancel</f-btn>
        <f-btn color="primary" :loading="starting" @click="begin">Start test</f-btn>
      </template>
    </f-dialog>
  </div>
</template>

<style scoped>
.st {
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.st__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.st__sub {
  margin: 6px 0 0;
  opacity: 0.7;
}
.st__resume {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.st__h2 {
  margin: 0 0 12px;
  font-size: 1rem;
  font-weight: 600;
  opacity: 0.8;
}
.st__results {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.st__result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  border-radius: var(--fui-radius-md);
  background: rgb(var(--fui-theme-surface));
  cursor: pointer;
}
.st__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}
.st__card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  border-radius: var(--fui-radius-lg);
  background: rgb(var(--fui-theme-surface));
}
.st__card-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}
.st__card-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
}
.st__note {
  margin: 12px 0 0;
  font-size: 0.85rem;
  opacity: 0.6;
}
.st__dlg-alert {
  margin-bottom: 12px;
}
</style>
