<script setup lang="ts">
import { uploadToCloudinary } from '~/lib/cloudinary'

const emit = defineEmits<{ send: [content: string, attachments: string[]]; typing: [value: boolean] }>()

const text = ref('')
const attachments = ref<string[]>([])
const uploading = ref(false)
const error = ref('')
const fileInput = ref<HTMLInputElement>()
let typingTimer: ReturnType<typeof setTimeout> | undefined

function onInput() {
  emit('typing', true)
  clearTimeout(typingTimer)
  typingTimer = setTimeout(() => emit('typing', false), 2000)
}

function submit() {
  if (!text.value.trim() && attachments.value.length === 0) return
  emit('send', text.value, [...attachments.value])
  text.value = ''
  attachments.value = []
  emit('typing', false)
}

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  error.value = ''
  uploading.value = true
  try {
    const { secureUrl } = await uploadToCloudinary(file, { folder: 'chat' })
    attachments.value.push(secureUrl)
  } catch (err: unknown) {
    error.value = (err as Error)?.message ?? 'Upload failed'
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<template>
  <form class="ci" @submit.prevent="submit">
    <p v-if="attachments.length" class="ci__attach">{{ attachments.length }} attachment(s) ready</p>
    <p v-if="error" class="ci__error">{{ error }}</p>
    <div class="ci__row">
      <input ref="fileInput" type="file" hidden @change="onFile" />
      <f-btn type="button" variant="text" icon="paperclip" :loading="uploading" aria-label="Attach" @click="fileInput?.click()" />
      <f-input v-model="text" placeholder="Type a message…" @update:model-value="onInput" />
      <f-btn type="submit" color="primary" icon="send" aria-label="Send" />
    </div>
  </form>
</template>

<style scoped>
.ci {
  border-top: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  padding: 10px 12px;
  background: rgb(var(--fui-theme-background));
}
.ci__attach {
  margin: 0 0 6px;
  font-size: 0.8rem;
  opacity: 0.7;
}
.ci__error {
  margin: 0 0 6px;
  font-size: 0.8rem;
  color: rgb(var(--fui-theme-danger));
}
.ci__row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ci__row :deep(.fui-input),
.ci__row :deep(.fui-field) {
  flex: 1;
}
</style>
