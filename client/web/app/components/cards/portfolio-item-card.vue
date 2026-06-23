<script setup lang="ts">
import type { PortfolioItem } from '~/types/portfolio'

const props = defineProps<{
  item: PortfolioItem
  editable?: boolean
  saving?: boolean
  to?: string | null
}>()
const emit = defineEmits<{ toggleVisibility: [value: boolean] }>()

const cover = computed(() => props.item.fileUrls?.[0] ?? null)
const linkTo = computed(() => props.to ?? `/portfolio/${props.item.id}`)
</script>

<template>
  <article class="pic">
    <component :is="to === null ? 'div' : 'NuxtLink'" :to="to === null ? undefined : linkTo" class="pic__media">
      <img v-if="cover" :src="cover" :alt="item.projectTitle" loading="lazy" />
      <div v-else class="pic__placeholder"><f-icon icon="image" /></div>
    </component>

    <div class="pic__body">
      <h3 class="pic__title">{{ item.projectTitle }}</h3>
      <p class="pic__biz">{{ item.businessName }}</p>
      <div v-if="item.clientRating != null" class="pic__rating">★ {{ item.clientRating.toFixed(1) }}</div>
      <div v-if="item.skills.length" class="pic__skills">
        <f-chip v-for="s in item.skills.slice(0, 3)" :key="s">{{ s }}</f-chip>
      </div>

      <div v-if="editable" class="pic__vis" @click.stop>
        <f-switch
          :model-value="item.isPublic"
          color="primary"
          :loading="saving"
          @update:model-value="emit('toggleVisibility', $event as boolean)"
        />
        <span>{{ item.isPublic ? 'Public' : 'Private' }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.pic {
  display: flex;
  flex-direction: column;
  border-radius: var(--fui-radius-lg);
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  background: rgb(var(--fui-theme-surface));
  overflow: hidden;
}
.pic__media {
  display: block;
  aspect-ratio: 16 / 10;
  background: rgba(var(--fui-theme-on-background), 0.05);
}
.pic__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.pic__placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 28px;
  opacity: 0.4;
}
.pic__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
}
.pic__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}
.pic__biz {
  margin: 0;
  opacity: 0.65;
  font-size: 0.85rem;
}
.pic__rating {
  font-size: 0.85rem;
  color: rgb(var(--fui-theme-warning));
  font-weight: 600;
}
.pic__skills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.pic__vis {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 0.85rem;
  opacity: 0.8;
}
</style>
