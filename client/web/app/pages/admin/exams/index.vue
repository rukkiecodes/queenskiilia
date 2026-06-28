<script setup lang="ts">
import { fetchAdminExams, fetchAdminSkills, createExam, type Exam } from '~/lib/admin-exams'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Admin — Exams' })

const status = ref('')
const statusFilters = [
  { v: '', l: 'All' },
  { v: 'draft', l: 'Draft' },
  { v: 'published', l: 'Published' },
  { v: 'archived', l: 'Archived' },
]

const { data: exams, pending, refresh } = await useAsyncData(
  'admin-exams',
  () => fetchAdminExams(undefined, undefined, status.value || undefined),
  { watch: [status] },
)
const { data: skills } = await useAsyncData('admin-skills', () => fetchAdminSkills())

const LEVELS = ['beginner', 'intermediate', 'advanced']

const dialogOpen = ref(false)
const form = reactive({ skillName: '', level: 'beginner', title: '' })
const creating = ref(false)
const error = ref('')

const skillNames = computed(() => (skills.value ?? []).map((s) => s.name))

function openNew() {
  form.skillName = skillNames.value[0] ?? ''
  form.level = 'beginner'
  form.title = ''
  error.value = ''
  dialogOpen.value = true
}

async function create() {
  const skill = (skills.value ?? []).find((s) => s.name === form.skillName)
  if (!skill || !form.title.trim()) {
    error.value = 'Pick a skill and enter a title'
    return
  }
  creating.value = true
  error.value = ''
  try {
    const exam = await createExam({ skillId: skill.id, level: form.level, title: form.title.trim() })
    dialogOpen.value = false
    await navigateTo(`/admin/exams/${exam.id}`)
  } catch (e: any) {
    error.value = e?.message || 'Failed to create exam'
  } finally {
    creating.value = false
  }
}

const statusClass = (s: string) =>
  s === 'published' ? 'ad__status--approved' : s === 'archived' ? 'ad__status--rejected' : 'ad__status--pending'
</script>

<template>
  <div>
    <div class="xh">
      <div>
        <h1 class="ad__title">Exams</h1>
        <p class="ad__sub">Author AI-assisted skill certification exams.</p>
      </div>
      <f-btn color="primary" prepend-icon="plus" @click="openNew">New exam</f-btn>
    </div>

    <div class="ad__filters">
      <button v-for="f in statusFilters" :key="f.v" class="ad__chip" :class="{ 'ad__chip--on': status === f.v }" @click="status = f.v">
        {{ f.l }}
      </button>
    </div>

    <p v-if="pending && !exams" class="ad__empty">Loading…</p>
    <p v-else-if="!exams?.length" class="ad__empty">No exams yet — create your first one.</p>

    <div v-else class="ad__list">
      <NuxtLink v-for="ex in exams" :key="ex.id" :to="`/admin/exams/${ex.id}`" class="ad__row xrow">
        <div class="ad__who">
          <strong>{{ ex.title }}</strong>
          <span class="ad__meta">{{ ex.skillName }} · {{ ex.level }}</span>
        </div>
        <div class="ad__meta">{{ ex.questionCount }} Q · {{ ex.totalPoints }} pts · pass {{ ex.passThreshold }}%</div>
        <span class="ad__status" :class="statusClass(ex.status)">{{ ex.status }}</span>
        <f-icon icon="chevron-right" class="xrow__chev" />
      </NuxtLink>
    </div>

    <f-dialog v-model="dialogOpen" blur :width="460">
      <template #header><h3 style="margin: 0">New exam</h3></template>
      <div class="xform">
        <f-select v-model="form.skillName" :items="skillNames" label="Skill" />
        <div>
          <span class="xform__lbl">Level</span>
          <div class="ad__filters" style="margin: 6px 0 0">
            <button v-for="l in LEVELS" :key="l" class="ad__chip" :class="{ 'ad__chip--on': form.level === l }" @click="form.level = l">
              {{ l }}
            </button>
          </div>
        </div>
        <f-input v-model="form.title" label="Exam title" placeholder="e.g. JavaScript Fundamentals" />
      </div>
      <p v-if="error" class="ad__error" style="margin-top: 12px">{{ error }}</p>
      <template #footer>
        <f-btn variant="text" @click="dialogOpen = false">Cancel</f-btn>
        <f-btn color="primary" :loading="creating" @click="create">Create &amp; build</f-btn>
      </template>
    </f-dialog>
  </div>
</template>

<style scoped>
.xh {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
}
.xrow {
  align-items: center;
  text-decoration: none;
  color: inherit;
}
.xrow__chev {
  opacity: 0.4;
}
.xform {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.xform__lbl {
  font-size: 0.82rem;
  opacity: 0.6;
}
</style>
