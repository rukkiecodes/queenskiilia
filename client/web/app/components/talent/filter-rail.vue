<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import CountryField from '~/components/forms/country-field.vue'
import { SKILL_LEVELS } from '~/types/filters'
import { useTalentFilters } from '~/composables/use-talent-filters'

defineProps<{ horizontal?: boolean }>()

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
  <div class="rail" :class="{ 'rail--h': horizontal }">
    <f-input class="rail__search" v-model="searchInput" placeholder="Search talent" prepend-icon="search" />
    <f-select class="rail__field" v-model="skillLevel" :items="[...SKILL_LEVELS]" label="Skill level" clearable />
    <CountryField class="rail__country" v-model="country" />
    <f-input class="rail__rating" v-model="ratingInput" type="number" label="Min rating" placeholder="0 – 5" />
    <f-btn class="rail__clear" variant="text" :block="!horizontal" @click="reset">Clear</f-btn>
  </div>
</template>

<style scoped>
.rail {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Horizontal bar (centered talent search). */
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
.rail--h .rail__country {
  flex: 0 0 180px;
}
.rail--h .rail__rating {
  flex: 0 0 120px;
}
.rail--h .rail__clear {
  flex: 0 0 auto;
}
</style>
