<script setup lang="ts">
import { formatDistanceToNowStrict } from 'date-fns'
import ProjectCard from '~/components/cards/project-card.vue'
import FilterRail from '~/components/projects/filter-rail.vue'
import { useProjects } from '~/composables/use-projects'
import { useMyProjects } from '~/composables/use-my-projects'
import { useAuthStore } from '~/stores/auth'
import type { Project, ProjectStatus } from '~/types/project'

const { query, projects } = useProjects()
const { isPending, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, suspense } = query

onServerPrefetch(() => suspense().catch(() => {}))

// Work this student was selected for (selectedStudent === me ⇒ status ≥ in_progress).
const auth = useAuthStore()
const { data: myProjects, suspense: mySuspense } = useMyProjects()
onServerPrefetch(() => mySuspense().catch(() => {}))
// Only in-flight work — completed projects live in the portfolio, not here.
const ACTIVE_STATUSES: ProjectStatus[] = ['in_progress', 'under_review', 'disputed']
const activeWork = computed(() =>
  (myProjects.value ?? []).filter(
    (p) => !!auth.user && p.selectedStudent === auth.user.id && ACTIVE_STATUSES.includes(p.status),
  ),
)
const statusColor: Record<ProjectStatus, string | undefined> = {
  open: 'primary',
  in_progress: 'warning',
  under_review: 'warning',
  completed: 'success',
  disputed: 'danger',
  cancelled: undefined,
}
function due(p: Project) {
  if (!p.deadline) return `${p.durationDays ?? 0}-day delivery`
  const d = new Date(p.deadline)
  return Number.isNaN(d.getTime()) ? '' : `Due ${formatDistanceToNowStrict(d, { addSuffix: true })}`
}
</script>

<template>
  <div class="mkt">
    <!-- Work this student was selected for -->
    <section v-if="activeWork.length" class="mkt__active">
      <h2 class="mkt__active-title">Your active work</h2>
      <div class="mkt__active-grid">
        <article
          v-for="p in activeWork"
          :key="p.id"
          class="workcard"
          role="link"
          tabindex="0"
          @click="navigateTo(`/projects/${p.id}`)"
          @keydown.enter="navigateTo(`/projects/${p.id}`)"
        >
          <div class="workcard__top">
            <h3 class="workcard__title">{{ p.title }}</h3>
            <f-chip :color="statusColor[p.status]">{{ statusLabel(p.status) }}</f-chip>
          </div>
          <p class="workcard__meta">
            {{ p.currency }} {{ p.budget.toLocaleString() }} · {{ due(p) }}
          </p>
          <f-btn
            color="primary"
            size="small"
            prepend-icon="briefcase"
            @click.stop="navigateTo(`/projects/${p.id}/workspace`)"
          >
            Open workspace
          </f-btn>
        </article>
      </div>
    </section>

    <header class="mkt__head">
      <h1 class="mkt__title">Find work</h1>
    </header>

    <!-- Centered horizontal filter, with breathing room from the top -->
    <div class="mkt__filterbar">
      <FilterRail horizontal />
    </div>

    <div class="mkt__listhead">
      <span class="mkt__count">{{ projects.length }} open project{{ projects.length === 1 ? '' : 's' }}</span>
      <f-btn variant="text" size="small" prepend-icon="file-text" @click="navigateTo('/projects/applications')">
        My applications
      </f-btn>
    </div>

    <section class="mkt__list">
      <p v-if="isPending" class="mkt__status">Loading projects…</p>
      <p v-else-if="isError" class="mkt__status mkt__status--err">{{ error?.message }}</p>
      <template v-else-if="projects.length">
        <div class="mkt__grid">
          <ProjectCard v-for="p in projects" :key="p.id" :project="p" />
        </div>
        <div v-if="hasNextPage" class="mkt__more">
          <f-btn variant="outlined" :loading="isFetchingNextPage" @click="() => fetchNextPage()">
            Load more
          </f-btn>
        </div>
      </template>
      <EmptyState
        v-else
        icon="search"
        title="No projects match"
        text="Try clearing filters or broadening your search."
      />
    </section>
  </div>
</template>

<style scoped>
.mkt {
  display: flex;
  flex-direction: column;
  /* White space above the filter; projects begin at half this below it. */
  --space: clamp(40px, 8vh, 80px);
}
.mkt__active {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 8px;
}
.mkt__active-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.mkt__active-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}
.workcard {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  border-radius: var(--fui-radius-lg);
  background: rgb(var(--fui-theme-surface));
  cursor: pointer;
  align-items: flex-start;
}
.workcard__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
}
.workcard__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.workcard__meta {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  opacity: 0.7;
}
.mkt__head {
  text-align: center;
}
.mkt__title {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.025em;
}
/* Centered horizontal filter with breathing room above it. */
.mkt__filterbar {
  width: 100%;
  max-width: 940px;
  margin: var(--space) auto 0;
}
/* Projects begin at half that white space below the filter. */
.mkt__listhead {
  margin-top: calc(var(--space) / 2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.mkt__count {
  font-size: 0.9rem;
  font-weight: 600;
  opacity: 0.6;
}
.mkt__list {
  margin-top: 12px;
}
.mkt__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.mkt__more {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
.mkt__status {
  opacity: 0.6;
}
.mkt__status--err {
  color: rgb(var(--fui-theme-danger));
}
</style>
