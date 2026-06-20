<script setup lang="ts">
import { format } from 'date-fns'
import { useReviewSubmission } from '~/composables/use-submissions'
import type { Submission } from '~/types/submission'

const props = defineProps<{ submission: Submission }>()
const { mutate: review, isPending } = useReviewSubmission()

const showRevision = ref(false)
const feedback = ref('')
const error = ref('')

const pending = computed(() => props.submission.status === 'submitted' || props.submission.status === 'pending')

function fileName(url: string) {
  try {
    return decodeURIComponent(url.split('/').pop() ?? 'file').split('?')[0]
  } catch {
    return 'file'
  }
}
function approve() {
  if (window.confirm('Approve this work? Escrow funds will be released to the student.')) {
    review(
      { projectId: props.submission.projectId, approve: true },
      { onError: (e: unknown) => (error.value = (e as Error)?.message ?? 'Review failed') },
    )
  }
}
function requestRevision() {
  error.value = ''
  review(
    { projectId: props.submission.projectId, approve: false, feedback: feedback.value.trim() || undefined },
    {
      onSuccess: () => {
        showRevision.value = false
        feedback.value = ''
      },
      onError: (e: unknown) => (error.value = (e as Error)?.message ?? 'Review failed'),
    },
  )
}
</script>

<template>
  <div class="rp">
    <h3 class="rp__title">Submitted work</h3>
    <p class="rp__when">Submitted {{ format(new Date(submission.submittedAt), 'PPp') }}</p>

    <ul v-if="submission.fileUrls.length" class="rp__files">
      <li v-for="u in submission.fileUrls" :key="u">
        <a :href="u" target="_blank" rel="noopener"><f-icon icon="file" /> {{ fileName(u) }}</a>
      </li>
    </ul>

    <p v-if="submission.notes" class="rp__notes">{{ submission.notes }}</p>

    <f-alert v-if="error" type="error" variant="flat">{{ error }}</f-alert>

    <template v-if="pending">
      <div v-if="!showRevision" class="rp__actions">
        <f-btn color="primary" :loading="isPending" @click="approve">Approve &amp; release funds</f-btn>
        <f-btn variant="outlined" @click="showRevision = true">Request revision</f-btn>
      </div>
      <div v-else class="rp__revision">
        <f-textarea v-model="feedback" label="What needs changing?" :rows="3" />
        <div class="rp__actions">
          <f-btn variant="text" @click="showRevision = false">Cancel</f-btn>
          <f-btn color="primary" :loading="isPending" @click="requestRevision">Send revision request</f-btn>
        </div>
      </div>
    </template>

    <f-alert v-else-if="submission.status === 'approved'" type="success" variant="flat">
      You approved this work — funds released.
    </f-alert>
    <f-alert v-else-if="submission.status === 'revision_requested'" type="warning" variant="flat">
      Revision requested. Waiting for the student to resubmit.
    </f-alert>
  </div>
</template>

<style scoped>
.rp {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border-radius: var(--fui-radius-lg);
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  background: rgb(var(--fui-theme-surface));
}
.rp__title {
  margin: 0;
  font-weight: 600;
}
.rp__when {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.6;
}
.rp__files {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.rp__files a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgb(var(--fui-theme-primary));
  text-decoration: none;
}
.rp__notes {
  margin: 0;
  white-space: pre-wrap;
  opacity: 0.85;
}
.rp__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.rp__revision {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
