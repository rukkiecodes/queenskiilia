<script setup lang="ts">
import { uploadToCloudinary } from '~/lib/cloudinary'
import { useSubmitVerification } from '~/composables/use-verification'

const { mutate, isPending: submitting } = useSubmitVerification()
const fileInput = ref<HTMLInputElement>()
const uploading = ref(false)
const progress = ref(0)
const error = ref('')
const done = ref(false)

function pick() {
  fileInput.value?.click()
}

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 8 * 1024 * 1024) {
    error.value = 'File must be under 8MB'
    return
  }
  error.value = ''
  done.value = false
  uploading.value = true
  progress.value = 0
  try {
    const { secureUrl } = await uploadToCloudinary(file, {
      folder: 'verification/id',
      onProgress: (p) => (progress.value = p),
    })
    mutate(
      { type: 'id_document', documentUrl: secureUrl },
      {
        onSuccess: () => (done.value = true),
        onError: (err: unknown) => (error.value = (err as Error)?.message ?? 'Submission failed'),
      },
    )
  } catch (err: unknown) {
    error.value = (err as Error)?.message ?? 'Upload failed'
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="idu">
    <p class="idu__hint">Upload a clear photo of a government-issued ID (passport, driver's licence, or national ID).</p>

    <f-alert v-if="done" type="success" variant="flat">ID submitted — pending review.</f-alert>
    <f-alert v-else-if="error" type="error" variant="flat">{{ error }}</f-alert>

    <f-progress-linear v-if="uploading" :model-value="progress" />

    <input ref="fileInput" type="file" accept="image/*,application/pdf" hidden @change="onFile" />
    <f-btn
      color="primary"
      prepend-icon="upload"
      :loading="uploading || submitting"
      :disabled="done"
      @click="pick"
    >
      {{ done ? 'Submitted' : 'Upload ID document' }}
    </f-btn>
  </div>
</template>

<style scoped>
.idu {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.idu__hint {
  margin: 0;
  opacity: 0.7;
  font-size: 0.9rem;
}
</style>
