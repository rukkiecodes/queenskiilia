<script setup lang="ts">
import { formatDistanceToNowStrict } from 'date-fns'
import type { Project } from '~/types/project'

const props = defineProps<{ project: Project }>()

const deadline = computed(() => {
  const d = new Date(props.project.deadline)
  return Number.isNaN(d.getTime())
    ? props.project.deadline
    : formatDistanceToNowStrict(d, { addSuffix: true })
})
const budget = computed(() => `${props.project.currency} ${props.project.budget.toLocaleString()}`)
</script>

<template>
  <article class="pcard" tabindex="0" role="link" @click="navigateTo(`/projects/${project.id}`)" @keydown.enter="navigateTo(`/projects/${project.id}`)">
    <div class="pcard__head">
      <h3 class="pcard__title">{{ project.title }}</h3>
      <f-chip color="primary">{{ project.skillLevel }}</f-chip>
    </div>
    <p class="pcard__desc">{{ project.description }}</p>
    <div v-if="project.requiredSkills.length" class="pcard__skills">
      <f-chip v-for="s in project.requiredSkills.slice(0, 4)" :key="s">{{ s }}</f-chip>
      <span v-if="project.requiredSkills.length > 4" class="pcard__more">+{{ project.requiredSkills.length - 4 }}</span>
    </div>
    <div class="pcard__foot">
      <span class="pcard__budget">{{ budget }}</span>
      <span class="pcard__deadline">Due {{ deadline }}</span>
    </div>
  </article>
</template>

<style scoped>
.pcard {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  border-radius: var(--fui-radius-lg);
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  background: rgb(var(--fui-theme-surface));
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.pcard:hover {
  border-color: rgba(var(--fui-theme-primary), 0.5);
  transform: translateY(-2px);
}
.pcard__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.pcard__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.pcard__desc {
  margin: 0;
  opacity: 0.7;
  font-size: 0.9rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.pcard__skills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.pcard__more {
  font-size: 0.8rem;
  opacity: 0.6;
}
.pcard__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 2px;
}
.pcard__budget {
  font-weight: 600;
  color: rgb(var(--fui-theme-primary));
}
.pcard__deadline {
  font-size: 0.82rem;
  opacity: 0.6;
}
</style>
