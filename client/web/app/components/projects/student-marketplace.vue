<script setup lang="ts">
import ProjectCard from '~/components/cards/project-card.vue'
import FilterRail from '~/components/projects/filter-rail.vue'
import { useProjects } from '~/composables/use-projects'

const { query, projects } = useProjects()
const { isPending, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, suspense } = query

onServerPrefetch(() => suspense().catch(() => {}))

const showFilters = ref(false)
</script>

<template>
  <div class="mkt">
    <header class="mkt__head">
      <div>
        <h1 class="mkt__title">Find work</h1>
        <p class="mkt__sub">{{ projects.length }} open project{{ projects.length === 1 ? '' : 's' }}</p>
      </div>
      <div class="mkt__actions">
        <f-btn variant="text" prepend-icon="file-text" @click="navigateTo('/projects/applications')">
          My applications
        </f-btn>
        <f-btn class="mkt__filter-btn" variant="outlined" prepend-icon="sliders" @click="showFilters = true">
          Filters
        </f-btn>
      </div>
    </header>

    <div class="mkt__body">
      <aside class="mkt__rail"><FilterRail /></aside>

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

    <f-dialog v-model="showFilters" :width="360">
      <template #header><h3>Filters</h3></template>
      <FilterRail />
    </f-dialog>
  </div>
</template>

<style scoped>
.mkt {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.mkt__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.mkt__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.mkt__sub {
  margin: 4px 0 0;
  opacity: 0.6;
  font-size: 0.9rem;
}
.mkt__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.mkt__body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}
.mkt__rail {
  display: none;
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

@media (min-width: 900px) {
  .mkt__body {
    grid-template-columns: 260px 1fr;
  }
  .mkt__rail {
    display: block;
    position: sticky;
    top: 80px;
    align-self: start;
  }
  .mkt__filter-btn {
    display: none;
  }
}
</style>
