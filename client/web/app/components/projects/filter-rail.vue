<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import { PROJECT_SORTS, SKILL_LEVELS, type ProjectSort } from '~/types/filters'
import { useProjectFilters } from '~/composables/use-project-filters'

defineProps<{ horizontal?: boolean }>()

const { search, skillLevel, budgetMin, budgetMax, sortBy, setBudget, reset } = useProjectFilters()

// Search — debounce the input into the URL.
const searchInput = ref(search.value)
const searchDebounced = refDebounced(searchInput, 400)
watch(searchDebounced, (v) => {
  if (v !== search.value) search.value = v
})
watch(search, (v) => {
  if (v !== searchInput.value) searchInput.value = v
})

// Budget — debounce min/max into the URL (guard against the URL→input echo loop).
const minInput = ref(budgetMin.value?.toString() ?? '')
const maxInput = ref(budgetMax.value?.toString() ?? '')
const minDebounced = refDebounced(minInput, 400)
const maxDebounced = refDebounced(maxInput, 400)
watch([minDebounced, maxDebounced], ([mn, mx]) => {
  const nextMin = mn ? Number(mn) : null
  const nextMax = mx ? Number(mx) : null
  if (nextMin !== budgetMin.value || nextMax !== budgetMax.value) setBudget(nextMin, nextMax)
})
watch([budgetMin, budgetMax], ([mn, mx]) => {
  minInput.value = mn?.toString() ?? ''
  maxInput.value = mx?.toString() ?? ''
})

const SORT_LABELS: Record<ProjectSort, string> = {
  latest: 'Latest',
  budget_high: 'Budget: high to low',
  budget_low: 'Budget: low to high',
  deadline_soon: 'Deadline soon',
}
const sortItems = PROJECT_SORTS.map((v) => ({ value: v, title: SORT_LABELS[v] }))
</script>

<template>
  <div class="rail" :class="{ 'rail--h': horizontal }">
    <f-input class="rail__search" v-model="searchInput" placeholder="Search projects" prepend-icon="search" />
    <f-select class="rail__field" v-model="skillLevel" :items="[...SKILL_LEVELS]" label="Skill level" clearable />
    <div class="rail__budget">
      <f-input v-model="minInput" type="number" label="Min budget" />
      <f-input v-model="maxInput" type="number" label="Max budget" />
    </div>
    <f-select class="rail__field" v-model="sortBy" :items="sortItems" item-title="title" item-value="value" label="Sort by" />
    <f-btn class="rail__clear" variant="text" :block="!horizontal" @click="reset">Clear</f-btn>
  </div>
</template>

<style scoped>
.rail {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.rail__budget {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

/* Horizontal bar (talent marketplace) — flexed + wraps, controls sized. */
.rail--h {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: center;
  gap: 12px;
}
.rail--h .rail__search {
  flex: 1 1 200px;
  max-width: 300px;
}
.rail--h .rail__field {
  flex: 0 0 160px;
}
.rail--h .rail__budget {
  flex: 0 0 auto;
  grid-template-columns: 104px 104px;
}
.rail--h .rail__clear {
  flex: 0 0 auto;
}
</style>
