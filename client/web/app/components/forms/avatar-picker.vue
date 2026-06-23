<script setup lang="ts">
import { useUploadAvatar } from '~/composables/use-profile-mutations'
import { useMe } from '~/composables/use-me'

const { me } = useMe()
const { mutate, isPending } = useUploadAvatar()
const fileInput = ref<HTMLInputElement>()
const preview = ref<string | null>(null)
const error = ref('')

const initial = computed(() =>
  (me.value?.fullName ?? me.value?.email ?? 'U').charAt(0).toUpperCase(),
)

function pick() {
  fileInput.value?.click()
}
function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'Image must be under 5MB'
    return
  }
  error.value = ''
  preview.value = URL.createObjectURL(file)
  mutate(file, { onError: (err: unknown) => (error.value = (err as Error)?.message ?? 'Upload failed') })
}
</script>

<template>
  <div class="avatar-picker">
    <f-avatar
      :image="preview ?? me?.avatarUrl ?? undefined"
      :text="initial"
      :size="84"
      circle
      :loading="isPending"
    />
    <div class="avatar-picker__actions">
      <input ref="fileInput" type="file" accept="image/*" hidden @change="onFile" />
      <f-btn variant="outlined" color="primary" size="small" :loading="isPending" @click="pick">
        Change photo
      </f-btn>
      <p v-if="error" class="avatar-picker__error">{{ error }}</p>
    </div>
  </div>
</template>

<style scoped>
.avatar-picker {
  display: flex;
  align-items: center;
  gap: 16px;
}
.avatar-picker__error {
  margin: 6px 0 0;
  font-size: 0.8rem;
  color: rgb(var(--fui-theme-danger));
}
</style>
