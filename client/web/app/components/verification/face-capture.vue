<script setup lang="ts">
import { uploadToCloudinary } from '~/lib/cloudinary'
import { useSubmitVerification } from '~/composables/use-verification'

const { mutate, isPending: submitting } = useSubmitVerification()
const video = ref<HTMLVideoElement>()
const canvas = ref<HTMLCanvasElement>()
const fileInput = ref<HTMLInputElement>()
const streaming = ref(false)
const uploading = ref(false)
const error = ref('')
const done = ref(false)
let stream: MediaStream | null = null

async function start() {
  error.value = ''
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
    if (video.value) {
      video.value.srcObject = stream
      await video.value.play()
    }
    streaming.value = true
  } catch {
    error.value = 'Camera unavailable — upload a selfie instead.'
  }
}

function stop() {
  stream?.getTracks().forEach((t) => t.stop())
  stream = null
  streaming.value = false
}

async function submit(blob: Blob) {
  uploading.value = true
  try {
    const { secureUrl } = await uploadToCloudinary(blob, { folder: 'verification/face' })
    mutate(
      { type: 'face', documentUrl: secureUrl },
      {
        onSuccess: () => {
          done.value = true
          stop()
        },
        onError: (err: unknown) => (error.value = (err as Error)?.message ?? 'Submission failed'),
      },
    )
  } catch (err: unknown) {
    error.value = (err as Error)?.message ?? 'Upload failed'
  } finally {
    uploading.value = false
  }
}

function capture() {
  if (!video.value || !canvas.value) return
  const c = canvas.value
  const v = video.value
  c.width = v.videoWidth
  c.height = v.videoHeight
  c.getContext('2d')?.drawImage(v, 0, 0)
  c.toBlob((blob) => blob && submit(blob), 'image/jpeg', 0.9)
}

function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) submit(file)
}

onUnmounted(stop)
</script>

<template>
  <div class="face">
    <p class="face__hint">Take a selfie so we can match it to your ID.</p>

    <f-alert v-if="done" type="success" variant="flat">Selfie submitted — pending review.</f-alert>
    <f-alert v-else-if="error" type="error" variant="flat">{{ error }}</f-alert>

    <div v-show="streaming" class="face__stage">
      <video ref="video" class="face__video" playsinline muted />
    </div>
    <canvas ref="canvas" hidden />

    <div class="face__actions">
      <f-btn v-if="!streaming && !done" variant="outlined" color="primary" prepend-icon="webcam" @click="start">
        Start camera
      </f-btn>
      <f-btn v-if="streaming" color="primary" prepend-icon="camera" :loading="uploading || submitting" @click="capture">
        Capture
      </f-btn>
      <f-btn v-if="streaming" variant="text" @click="stop">Cancel</f-btn>

      <input ref="fileInput" type="file" accept="image/*" capture="user" hidden @change="onFile" />
      <f-btn v-if="!streaming && !done" variant="text" :loading="uploading || submitting" @click="fileInput?.click()">
        Upload instead
      </f-btn>
    </div>
  </div>
</template>

<style scoped>
.face {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.face__hint {
  margin: 0;
  opacity: 0.7;
  font-size: 0.9rem;
}
.face__stage {
  border-radius: var(--fui-radius-lg);
  overflow: hidden;
  background: #000;
  max-width: 360px;
}
.face__video {
  width: 100%;
  display: block;
  transform: scaleX(-1);
}
.face__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
</style>
