<script setup lang="ts">
import UserCard from '~/components/cards/user-card.vue'
import TalentFilterRail from '~/components/talent/filter-rail.vue'
import { useTalentSearch } from '~/composables/use-talent-search'

definePageMeta({ layout: 'app', middleware: 'role', requiresRole: 'business' })

const { query, talents } = useTalentSearch()
const { isPending, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, suspense } = query
onServerPrefetch(() => suspense().catch(() => {}))

const showFilters = ref(false)
</script>

<template>
  <div class="tal">
    <header class="tal__head">
      <div>
        <h1 class="tal__title">Find talent</h1>
        <p class="tal__sub">Browse skill-tested, verified students.</p>
      </div>
      <f-btn class="tal__filter-btn" variant="outlined" prepend-icon="sliders" @click="showFilters = true">
        Filters
      </f-btn>
    </header>

    <div class="tal__body">
      <aside class="tal__rail"><TalentFilterRail /></aside>

      <section class="tal__list">
        <p v-if="isPending" class="tal__status">Loading talent…</p>
        <p v-else-if="isError" class="tal__status tal__status--err">{{ error?.message }}</p>
        <template v-else-if="talents.length">
          <div class="tal__grid">
            <UserCard v-for="t in talents" :key="t.id" :user="t" />
          </div>
          <div v-if="hasNextPage" class="tal__more">
            <f-btn variant="outlined" :loading="isFetchingNextPage" @click="() => fetchNextPage()">Load more</f-btn>
          </div>
        </template>
        <EmptyState
          v-else
          icon="users"
          title="No talent matches"
          text="Try clearing filters or broadening your search."
        />
      </section>
    </div>

    <f-dialog v-model="showFilters" :width="360">
      <template #header><h3>Filters</h3></template>
      <TalentFilterRail />
    </f-dialog>
  </div>
</template>

<style scoped>
.tal {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.tal__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.tal__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.tal__sub {
  margin: 4px 0 0;
  opacity: 0.65;
}
.tal__body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}
.tal__rail {
  display: none;
}
.tal__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.tal__more {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
.tal__status {
  opacity: 0.6;
}
.tal__status--err {
  color: rgb(var(--fui-theme-danger));
}

@media (min-width: 900px) {
  .tal__body {
    grid-template-columns: 260px 1fr;
  }
  .tal__rail {
    display: block;
    position: sticky;
    top: 80px;
    align-self: start;
  }
  .tal__filter-btn {
    display: none;
  }
}
</style>
