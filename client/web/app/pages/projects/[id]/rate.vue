<script setup lang="ts">
import RatingForm from '~/components/ratings/rating-form.vue'
import { useProject } from '~/composables/use-project'
import { useSubmitRating } from '~/composables/use-ratings-disputes'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'app' })

const route = useRoute()
const id = computed(() => route.params.id as string)
const auth = useAuthStore()

const { data: project, suspense } = useProject(() => id.value)
onServerPrefetch(() => suspense().catch(() => {}))

const { mutate, isPending } = useSubmitRating()
const reviewerType = computed<'student' | 'business'>(() =>
  auth.user?.id === project.value?.businessId ? 'business' : 'student',
)
const revieweeId = computed(() =>
  reviewerType.value === 'business' ? project.value?.selectedStudent : project.value?.businessId,
)

const done = ref(false)
const error = ref('')

function onSubmit(scores: Record<string, number>, comment: string) {
  if (!revieweeId.value) {
    error.value = 'You can rate once the project is complete.'
    return
  }
  error.value = ''
  mutate(
    {
      projectId: id.value,
      revieweeId: revieweeId.value,
      reviewerType: reviewerType.value,
      ...scores,
      comment: comment.trim() || undefined,
    },
    {
      onSuccess: () => (done.value = true),
      onError: (e: unknown) => (error.value = (e as Error)?.message ?? 'Could not submit your rating.'),
    },
  )
}
</script>

<template>
  <div v-if="project" class="rate">
    <button type="button" class="rate__back" @click="navigateTo(`/projects/${project.id}`)">
      <f-icon icon="arrow-left" /> Project
    </button>
    <h1 class="rate__title">Rate {{ reviewerType === 'business' ? 'the talent' : 'the client' }}</h1>
    <p class="rate__sub">{{ project.title }}</p>

    <template v-if="done">
      <f-alert type="success" variant="flat">Thanks for your feedback!</f-alert>
      <f-btn color="primary" @click="navigateTo(`/projects/${project.id}`)">Back to project</f-btn>
    </template>
    <template v-else>
      <f-alert v-if="error" type="error" variant="flat">{{ error }}</f-alert>
      <RatingForm :reviewer-type="reviewerType" :loading="isPending" @submit="onSubmit" />
    </template>
  </div>
  <p v-else class="rate__loading">Loading…</p>
</template>

<style scoped>
.rate {
  max-width: 460px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.rate__back {
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
.rate__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.rate__sub {
  margin: 0;
  opacity: 0.7;
}
.rate__loading {
  opacity: 0.6;
}
</style>
