<script setup lang="ts">
import FileUpload from '~/components/forms/file-upload.vue'
import { useSubmission, useSubmitWork } from '~/composables/use-submissions'

definePageMeta({ layout: 'app', middleware: 'role', requiresRole: 'student' })

const route = useRoute()
const id = computed(() => route.params.id as string)

const liveUrl = ref('')
const files = ref<string[]>([])
const notes = ref('')
const error = ref('')

const { data: existing } = useSubmission(() => id.value)
const { mutate: submit, isPending } = useSubmitWork()

function isValidUrl(v: string): boolean {
  try {
    const u = new URL(v)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
// The live URL is mandatory before work can be submitted.
const liveUrlValid = computed(() => isValidUrl(liveUrl.value.trim()))

function doSubmit() {
  const url = liveUrl.value.trim()
  if (!url) {
    error.value = 'Add the live URL to your work before submitting.'
    return
  }
  if (!liveUrlValid.value) {
    error.value = 'Enter a valid live URL starting with https://'
    return
  }
  error.value = ''
  // Live URL leads the deliverables, followed by any supporting files.
  submit(
    { projectId: id.value, fileUrls: [url, ...files.value], notes: notes.value.trim() || undefined },
    {
      onSuccess: () => navigateTo(`/projects/${id.value}/workspace`),
      onError: (e: unknown) => {
        error.value = (e as Error)?.message ?? 'Could not submit your work.'
      },
    },
  )
}
</script>

<template>
  <div class="sub">
    <button type="button" class="sub__back" @click="navigateTo(`/projects/${id}/workspace`)">
      <f-icon icon="arrow-left" /> Workspace
    </button>

    <h1 class="sub__title">Submit your work</h1>

    <f-alert v-if="existing?.status === 'revision_requested'" type="warning" variant="flat">
      <strong>Revision requested:</strong> {{ existing.feedback }}
    </f-alert>
    <f-alert v-if="error" type="error" variant="flat">{{ error }}</f-alert>

    <f-input
      v-model="liveUrl"
      label="Live URL"
      placeholder="https://your-work.example.com"
      prepend-icon="link"
      hint="A live, working link to your deliverable — the client opens this to review."
      persistent-hint
    />

    <div class="sub__files">
      <span class="sub__files-label">Supporting files (optional)</span>
      <FileUpload v-model="files" folder="submissions" :max-size-mb="5" />
    </div>

    <f-textarea v-model="notes" label="Notes for the client (optional)" :rows="3" />

    <f-btn
      color="primary"
      block
      size="large"
      :loading="isPending"
      :disabled="!liveUrlValid"
      @click="doSubmit"
    >
      Submit for review
    </f-btn>
    <p v-if="!liveUrlValid" class="sub__gate">Add a valid live URL to enable submission.</p>
  </div>
</template>

<style scoped>
.sub {
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.sub__back {
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
.sub__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.sub__files {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sub__files-label {
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.55;
}
.sub__gate {
  margin: -6px 0 0;
  text-align: center;
  font-size: 0.82rem;
  opacity: 0.6;
}
</style>
