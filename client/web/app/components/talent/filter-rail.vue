<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import CountryField from '~/components/forms/country-field.vue'
import { SKILL_LEVELS } from '~/types/filters'
import { useTalentFilters } from '~/composables/use-talent-filters'

const { search, skillLevel, country, minRating, reset } = useTalentFilters()

const searchInput = ref(search.value)
const searchDebounced = refDebounced(searchInput, 400)
watch(searchDebounced, (v) => {
  if (v !== search.value) search.value = v
})
watch(search, (v) => {
  if (v !== searchInput.value) searchInput.value = v
})

const ratingInput = ref(minRating.value?.toString() ?? '')
const ratingDebounced = refDebounced(ratingInput, 400)
watch(ratingDebounced, (v) => {
  const n = v ? Number(v) : null
  if (n !== minRating.value) minRating.value = n
})
watch(minRating, (v) => {
  ratingInput.value = v?.toString() ?? ''
})
</script>

<template>
  <div class="rail">
    <f-input v-model="searchInput" placeholder="Search talent" prepend-icon="search" />
    <f-select v-model="skillLevel" :items="[...SKILL_LEVELS]" label="Skill level" clearable />
    <CountryField v-model="country" />
    <f-input v-model="ratingInput" type="number" label="Min rating" placeholder="0 – 5" />
    <f-btn variant="text" block @click="reset">Clear filters</f-btn>
  </div>
</template>

<style scoped>
.rail {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
