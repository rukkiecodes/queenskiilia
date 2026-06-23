<script setup lang="ts">
import { format } from 'date-fns'
import { usePortfolioItem } from '~/composables/use-portfolio'

definePageMeta({ layout: 'app' })

const route = useRoute()
const id = computed(() => route.params.itemId as string)
const { data: item, isPending, suspense } = usePortfolioItem(() => id.value)
onServerPrefetch(() => suspense().catch(() => {}))

const completed = computed(() => {
  if (!item.value) return ''
  const d = new Date(item.value.completedAt)
  return Number.isNaN(d.getTime()) ? item.value.completedAt : format(d, 'PP')
})
</script>

<template>
  <div v-if="item" class="pid">
    <button type="button" class="pid__back" @click="navigateTo('/portfolio')">
      <f-icon icon="arrow-left" /> Portfolio
    </button>

    <header class="pid__head">
      <h1 class="pid__title">{{ item.projectTitle }}</h1>
      <p class="pid__meta">{{ item.businessName }} · Completed {{ completed }}</p>
    </header>

    <div v-if="item.fileUrls.length" class="pid__gallery">
      <a v-for="(url, i) in item.fileUrls" :key="i" :href="url" target="_blank" rel="noopener" class="pid__shot">
        <img :src="url" :alt="`${item.projectTitle} ${i + 1}`" loading="lazy" />
      </a>
    </div>

    <p v-if="item.description" class="pid__desc">{{ item.description }}</p>

    <div v-if="item.skills.length" class="pid__skills">
      <f-chip v-for="s in item.skills" :key="s">{{ s }}</f-chip>
    </div>

    <section v-if="item.clientReview || item.clientRating != null" class="pid__review">
      <div class="pid__review-head">
        <strong>Client review</strong>
        <span v-if="item.clientRating != null" class="pid__stars">★ {{ item.clientRating.toFixed(1) }}</span>
      </div>
      <p v-if="item.clientReview" class="pid__review-text">“{{ item.clientReview }}”</p>
    </section>
  </div>

  <p v-else-if="isPending" class="pid__status">Loading…</p>
  <EmptyState v-else title="Item not found" text="This portfolio item may be private or removed." />
</template>

<style scoped>
.pid {
  max-width: 820px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.pid__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: rgb(var(--fui-theme-primary));
  cursor: pointer;
  font: inherit;
  padding: 0;
  align-self: flex-start;
}
.pid__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.pid__meta {
  margin: 4px 0 0;
  opacity: 0.7;
}
.pid__gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.pid__shot img {
  width: 100%;
  border-radius: var(--fui-radius-md);
  display: block;
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
}
.pid__desc {
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
}
.pid__skills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pid__review {
  padding: 18px;
  border-radius: var(--fui-radius-lg);
  background: rgba(var(--fui-theme-primary), 0.06);
}
.pid__review-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.pid__stars {
  color: rgb(var(--fui-theme-warning));
  font-weight: 600;
}
.pid__review-text {
  margin: 8px 0 0;
  font-style: italic;
}
.pid__status {
  opacity: 0.6;
}
</style>
