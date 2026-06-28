<script setup lang="ts">
import { fetchPublishedExams } from '~/lib/exams'

definePageMeta({ layout: 'app', middleware: 'role', requiresRole: 'student' })
useHead({ title: 'Skill tests' })

const level = ref('')
const levels = [
  { v: '', l: 'All levels' },
  { v: 'beginner', l: 'Beginner' },
  { v: 'intermediate', l: 'Intermediate' },
  { v: 'advanced', l: 'Advanced' },
]

const { data: exams, pending } = await useAsyncData(
  'published-exams',
  () => fetchPublishedExams(undefined, level.value || undefined),
  { watch: [level] },
)

const levelClass = (l: string) =>
  l === 'advanced' ? 'lv--adv' : l === 'intermediate' ? 'lv--int' : 'lv--beg'
</script>

<template>
  <div class="st">
    <header class="st__head">
      <h1 class="st__title">Skill certification</h1>
      <p class="st__sub">Prove your skills, earn a verifiable certificate.</p>
    </header>

    <div class="st__filters">
      <button v-for="l in levels" :key="l.v" class="st__chip" :class="{ 'st__chip--on': level === l.v }" @click="level = l.v">
        {{ l.l }}
      </button>
    </div>

    <p v-if="pending && !exams" class="st__empty">Loading…</p>
    <p v-else-if="!exams?.length" class="st__empty">No exams published yet — check back soon.</p>

    <div v-else class="st__grid">
      <NuxtLink v-for="ex in exams" :key="ex.id" :to="`/skill-tests/exam/${ex.id}`" class="st__card">
        <span class="st__lv" :class="levelClass(ex.level)">{{ ex.level }}</span>
        <strong class="st__card-title">{{ ex.title }}</strong>
        <span class="st__skill">{{ ex.skillName }}</span>
        <p v-if="ex.description" class="st__desc">{{ ex.description }}</p>
        <div class="st__facts">
          <span><f-icon icon="help-circle" /> {{ ex.questionCount }} questions</span>
          <span><f-icon icon="clock" /> {{ ex.durationMinutes }} min</span>
          <span><f-icon icon="target" /> pass {{ ex.passThreshold }}%</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.st__head {
  margin-bottom: 18px;
}
.st__title {
  margin: 0 0 4px;
}
.st__sub {
  opacity: 0.65;
  margin: 0;
}
.st__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}
.st__chip {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(var(--fui-theme-on-surface), 0.14);
  background: transparent;
  color: rgba(var(--fui-theme-on-surface), 0.7);
  font-weight: 600;
  font-size: 0.86rem;
  cursor: pointer;
}
.st__chip--on {
  background: rgb(var(--fui-theme-primary));
  border-color: rgb(var(--fui-theme-primary));
  color: #fff;
}
.st__empty {
  opacity: 0.55;
  padding: 32px 0;
  text-align: center;
}
.st__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
.st__card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px;
  border-radius: 16px;
  background: rgb(var(--fui-theme-surface));
  border: 1px solid rgba(var(--fui-theme-on-surface), 0.08);
  color: inherit;
  text-decoration: none;
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.st__card:hover {
  border-color: rgba(var(--fui-theme-primary), 0.5);
  transform: translateY(-2px);
}
.st__lv {
  align-self: flex-start;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: capitalize;
}
.lv--beg { background: rgba(16, 185, 129, 0.16); color: #047857; }
.lv--int { background: rgba(245, 158, 11, 0.18); color: #b45309; }
.lv--adv { background: rgba(229, 72, 77, 0.16); color: #b91c1c; }
.st__card-title {
  font-size: 1.05rem;
  margin-top: 4px;
}
.st__skill {
  opacity: 0.6;
  font-size: 0.86rem;
}
.st__desc {
  margin: 4px 0 0;
  font-size: 0.86rem;
  opacity: 0.75;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.st__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
  font-size: 0.8rem;
  opacity: 0.7;
}
.st__facts span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
