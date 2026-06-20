<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { gqlFetch } from '~/lib/graphql-client'

// Batch 0.3 smoke test: a public query fetched during SSR via Vue Query,
// hydrated on the client without a refetch.
interface SkillCategory {
  id: string
  name: string
  parentCategory: string | null
}

const SKILL_CATEGORIES = /* GraphQL */ `
  query SkillCategories {
    skillCategories {
      id
      name
      parentCategory
    }
  }
`

const { data, isPending, isError, error, suspense } = useQuery({
  queryKey: ['skillCategories'],
  queryFn: ({ signal }) =>
    gqlFetch<{ skillCategories: SkillCategory[] }>(SKILL_CATEGORIES, undefined, { signal }),
  select: (d) => d.skillCategories,
})

// Block SSR until the query resolves so its data is in the initial HTML.
onServerPrefetch(async () => {
  await suspense()
})
</script>

<template>
  <main class="smoke">
    <h1 class="smoke__title">GraphQL + Vue Query — SSR smoke test</h1>

    <p v-if="isPending" class="smoke__meta">Loading skill categories…</p>
    <p v-else-if="isError" class="smoke__err">Error: {{ error?.message }}</p>
    <template v-else>
      <p class="smoke__meta">
        Server-rendered <strong>{{ data?.length ?? 0 }}</strong> skill categories.
      </p>
      <ul class="smoke__grid">
        <li v-for="c in data" :key="c.id">
          <f-chip>{{ c.name }}</f-chip>
        </li>
      </ul>
    </template>
  </main>
</template>

<style scoped>
.smoke {
  min-height: 100dvh;
  padding: 48px clamp(16px, 5vw, 64px);
  background: rgb(var(--fui-theme-background));
  color: rgb(var(--fui-theme-on-background));
  font-family: var(--fui-font-family);
}
.smoke__title {
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
}
.smoke__meta {
  opacity: 0.7;
  margin: 0 0 24px;
}
.smoke__err {
  color: rgb(var(--fui-theme-danger));
}
.smoke__grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
