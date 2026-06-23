<script setup lang="ts">
import { uploadToCloudinary } from '~/lib/cloudinary'

const model = defineModel<string[]>({ default: () => [] })
const props = defineProps<{ folder?: string; maxSizeMb?: number }>()

const uploading = ref(false)
const progress = ref(0)
const error = ref('')
const dragging = ref(false)
const fileInput = ref<HTMLInputElement>()

function fileName(url: string) {
  try {
    return decodeURIComponent(url.split('/').pop() ?? 'file').split('?')[0]
  } catch {
    return 'file'
  }
}

async function handleFiles(files: FileList | File[]) {
  const max = props.maxSizeMb ?? 5
  for (const f of Array.from(files)) {
    if (f.size > max * 1024 * 1024) {
      error.value = `Each file must be under ${max}MB`
      continue
    }
    error.value = ''
    uploading.value = true
    progress.value = 0
    try {
      const { secureUrl } = await uploadToCloudinary(f, {
        folder: props.folder ?? 'submissions',
        resourceType: 'auto',
        onProgress: (p) => (progress.value = p),
      })
      model.value = [...model.value, secureUrl]
    } catch (e: unknown) {
      error.value = (e as Error)?.message ?? 'Upload failed'
    } finally {
      uploading.value = false
    }
  }
  if (fileInput.value) fileInput.value.value = ''
}

function onInput(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files) handleFiles(files)
}
function onDrop(e: DragEvent) {
  dragging.value = false
  if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files)
}
function remove(url: string) {
  model.value = model.value.filter((u) => u !== url)
}
</script>

<template>
  <div class="fu">
    <div
      class="fu__drop"
      :class="{ 'fu__drop--over': dragging }"
      role="button"
      tabindex="0"
      @click="fileInput?.click()"
      @keydown.enter="fileInput?.click()"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <input ref="fileInput" type="file" multiple hidden @change="onInput" />
      <f-icon icon="upload" class="fu__icon" />
      <span>Drag files here or click to upload</span>
    </div>

    <f-progress-linear v-if="uploading" :model-value="progress" class="fu__progress" />
    <p v-if="error" class="fu__error">{{ error }}</p>

    <ul v-if="model.length" class="fu__list">
      <li v-for="u in model" :key="u" class="fu__item">
        <a :href="u" target="_blank" rel="noopener" class="fu__name">{{ fileName(u) }}</a>
        <button type="button" class="fu__x" aria-label="Remove" @click="remove(u)">×</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.fu {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.fu__drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px;
  border: 2px dashed rgba(var(--fui-theme-on-background), 0.2);
  border-radius: var(--fui-radius-lg);
  cursor: pointer;
  text-align: center;
  opacity: 0.85;
}
.fu__drop--over {
  border-color: rgb(var(--fui-theme-primary));
  background: rgba(var(--fui-theme-primary), 0.05);
}
.fu__icon {
  font-size: 24px;
  color: rgb(var(--fui-theme-primary));
}
.fu__error {
  margin: 0;
  font-size: 0.85rem;
  color: rgb(var(--fui-theme-danger));
}
.fu__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.fu__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--fui-radius-md);
  background: rgba(var(--fui-theme-on-background), 0.05);
}
.fu__name {
  color: rgb(var(--fui-theme-primary));
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fu__x {
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 1.1rem;
  opacity: 0.6;
}
</style>
