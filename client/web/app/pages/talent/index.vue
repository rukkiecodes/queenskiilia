<script setup lang="ts">
import TalentCard from '~/components/cards/talent-card.vue'
import TalentFilterRail from '~/components/talent/filter-rail.vue'
import { useTalentSearch } from '~/composables/use-talent-search'

definePageMeta({ layout: 'app', middleware: 'role', requiresRole: 'business' })

const { query, talents } = useTalentSearch()
const { isPending, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, suspense } = query
onServerPrefetch(() => suspense().catch(() => {}))
</script>

<template>
  <div class="tal">
    <header class="tal__head">
      <h1 class="tal__title">Find talent</h1>
      <p class="tal__sub">Browse skill-tested, verified students.</p>
    </header>

    <!-- Centered horizontal filter, with breathing room from the top -->
    <div class="tal__filterbar">
      <TalentFilterRail horizontal />
    </div>

    <div class="tal__listhead">
      <span class="tal__count">{{ talents.length }} talent{{ talents.length === 1 ? '' : 's' }}</span>
    </div>

    <section class="tal__list">
      <p v-if="isPending" class="tal__status">Loading talent…</p>
      <p v-else-if="isError" class="tal__status tal__status--err">{{ error?.message }}</p>
      <template v-else-if="talents.length">
        <div class="tal__grid">
          <TalentCard v-for="t in talents" :key="t.id" :user="t" />
        </div>
        <div v-if="hasNextPage" class="tal__more">
          <f-btn variant="outlined" :loading="isFetchingNextPage" @click="() => fetchNextPage()">
            Load more
          </f-btn>
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
</template>

<style scoped>
.tal {
  display: flex;
  flex-direction: column;
  /* White space above the filter; talents begin at half this below it. */
  --space: clamp(40px, 8vh, 80px);
}
.tal__head {
  text-align: center;
}
.tal__title {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.025em;
}
.tal__sub {
  margin: 6px 0 0;
  opacity: 0.6;
}
.tal__filterbar {
  width: 100%;
  max-width: 940px;
  margin: var(--space) auto 0;
}
.tal__listhead {
  margin-top: calc(var(--space) / 2);
}
.tal__count {
  font-size: 0.9rem;
  font-weight: 600;
  opacity: 0.6;
}
.tal__list {
  margin-top: 12px;
}
.tal__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
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
</style>
