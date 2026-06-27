<script setup lang="ts">
import type { PortfolioItem } from '~/types/portfolio'

const props = defineProps<{
  item: PortfolioItem
  editable?: boolean
  saving?: boolean
}>()
const emit = defineEmits<{ toggleVisibility: [value: boolean]; open: [] }>()

// Cover: talent image first, then any real image among the files, else placeholder.
const cover = computed(
  () =>
    props.item.imageUrls?.[0] ??
    (props.item.fileUrls ?? []).find((u) => /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i.test(u)) ??
    null,
)
const initial = computed(() => (props.item.projectTitle?.charAt(0) ?? '?').toUpperCase())
</script>

<template>
  <f-card type="9" class="pcard" @click="emit('open')">
    <template #img>
      <img v-if="cover" :src="cover" :alt="item.projectTitle" loading="lazy" />
      <div v-else class="pcard__ph">
        <span class="pcard__ph-initial">{{ initial }}</span>
      </div>
    </template>

    <template #title><h3 class="pcard__title">{{ item.projectTitle }}</h3></template>

    <template #text>
      <p class="pcard__biz">{{ item.businessName }}</p>
      <div class="pcard__meta">
        <span v-if="item.clientRating != null" class="pcard__rating">★ {{ item.clientRating.toFixed(1) }}</span>
        <span v-if="item.likeCount" class="pcard__likes"><f-icon icon="heart" /> {{ item.likeCount }}</span>
      </div>
      <div v-if="item.skills.length" class="pcard__skills">
        <f-chip v-for="s in item.skills.slice(0, 3)" :key="s">{{ s }}</f-chip>
      </div>

      <div v-if="editable" class="pcard__vis" @click.stop>
        <f-switch
          :model-value="item.isPublic"
          color="primary"
          :loading="saving"
          @update:model-value="emit('toggleVisibility', $event as boolean)"
        />
        <span>{{ item.isPublic ? 'Public' : 'Private' }}</span>
      </div>
    </template>
  </f-card>
</template>

<style scoped>
.pcard {
  width: 100%;
  cursor: pointer;
}
.pcard__ph {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgb(var(--fui-theme-primary)), rgba(var(--fui-theme-primary), 0.55));
  color: #fff;
}
.pcard__ph-initial {
  font-size: 2.6rem;
  font-weight: 800;
}
.pcard__title {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 700;
}
.pcard__biz {
  margin: 4px 0 0;
  opacity: 0.65;
  font-size: 0.85rem;
}
.pcard__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 6px 0;
  font-size: 0.85rem;
  font-weight: 600;
}
.pcard__rating {
  color: #f5a623;
}
.pcard__likes {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  opacity: 0.7;
}
.pcard__skills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.pcard__vis {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 0.85rem;
  opacity: 0.8;
}
</style>
