<script setup lang="ts">
import RatingStars from '~/components/ratings/rating-stars.vue'
import type { ReviewerType } from '~/types/rating'

const props = defineProps<{ reviewerType: ReviewerType; loading?: boolean }>()
const emit = defineEmits<{ submit: [scores: Record<string, number>, comment: string] }>()

// Dimensions shown depend on who is being rated.
const BUSINESS_RATES_STUDENT = [
  { key: 'quality', label: 'Quality of work' },
  { key: 'communication', label: 'Communication' },
  { key: 'speed', label: 'Speed' },
  { key: 'professionalism', label: 'Professionalism' },
  { key: 'respect', label: 'Respect' },
]
const STUDENT_RATES_BUSINESS = [
  { key: 'communication', label: 'Communication' },
  { key: 'paymentFairness', label: 'Payment fairness' },
  { key: 'clarity', label: 'Clarity of brief' },
  { key: 'professionalism', label: 'Professionalism' },
  { key: 'respect', label: 'Respect' },
]
const dims = computed(() =>
  props.reviewerType === 'business' ? BUSINESS_RATES_STUDENT : STUDENT_RATES_BUSINESS,
)

const scores = reactive<Record<string, number>>({})
const comment = ref('')

function submit() {
  const filled = Object.fromEntries(Object.entries(scores).filter(([, v]) => v > 0))
  emit('submit', filled, comment.value)
}
</script>

<template>
  <form class="rf" @submit.prevent="submit">
    <div v-for="d in dims" :key="d.key" class="rf__dim">
      <span class="rf__label">{{ d.label }}</span>
      <RatingStars v-model="scores[d.key]" />
    </div>
    <f-textarea v-model="comment" label="Comment (optional)" :rows="3" />
    <f-btn color="primary" block type="submit" :loading="loading">Submit rating</f-btn>
  </form>
</template>

<style scoped>
.rf {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.rf__dim {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.rf__label {
  font-weight: 500;
}
</style>
