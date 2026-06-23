<script setup lang="ts">
import FileUpload from '~/components/forms/file-upload.vue'
import { useSubmission, useSubmitWork } from '~/composables/use-submissions'

definePageMeta({ layout: 'app', middleware: 'role', requiresRole: 'student' })

const route = useRoute()
const id = computed(() => route.params.id as string)

const files = ref<string[]>([])
const notes = ref('')
const error = ref('')

const { data: existing } = useSubmission(() => id.value)
const { mutate: submit, isPending } = useSubmitWork()

function doSubmit() {
  if (!files.value.length) {
    error.value = 'Attach at least one file.'
    return
  }
  error.value = ''
  submit(
    { projectId: id.value, fileUrls: files.value, notes: notes.value.trim() || undefined },
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

    <FileUpload v-model="files" folder="submissions" :max-size-mb="5" />

    <f-textarea v-model="notes" label="Notes for the client (optional)" :rows="3" />

    <f-btn color="primary" block size="large" :loading="isPending" @click="doSubmit">
      Submit for review
    </f-btn>
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
</style>
