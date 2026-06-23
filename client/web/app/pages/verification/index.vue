<script setup lang="ts">
import { useMe } from '~/composables/use-me'
import IdUploadForm from '~/components/verification/id-upload-form.vue'
import FaceCapture from '~/components/verification/face-capture.vue'
import type { VerificationStatus } from '~/types/profile'

definePageMeta({ layout: 'app' })

const { me } = useMe()

function statusFor(type: string): VerificationStatus | null {
  const list = (me.value?.verifications ?? [])
    .filter((v) => v.type === type)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  return list[0]?.status ?? null
}
const idStatus = computed(() => statusFor('id'))
const faceStatus = computed(() => statusFor('face'))

const statusColor: Record<VerificationStatus, string> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
}
</script>

<template>
  <div class="vp">
    <header class="vp__head">
      <h1 class="vp__title">Verification</h1>
      <f-chip v-if="me?.isVerified" color="success">Verified account</f-chip>
    </header>
    <p class="vp__sub">Verify your identity to earn a verified badge and unlock more trust.</p>

    <section class="vp__step">
      <div class="vp__step-head">
        <h2>ID document</h2>
        <f-chip v-if="idStatus" :color="statusColor[idStatus]">{{ idStatus }}</f-chip>
      </div>
      <IdUploadForm v-if="idStatus !== 'approved'" />
      <p v-else class="vp__done">Your ID has been verified.</p>
    </section>

    <section class="vp__step">
      <div class="vp__step-head">
        <h2>Face match</h2>
        <f-chip v-if="faceStatus" :color="statusColor[faceStatus]">{{ faceStatus }}</f-chip>
      </div>
      <FaceCapture v-if="faceStatus !== 'approved'" />
      <p v-else class="vp__done">Your selfie has been verified.</p>
    </section>
  </div>
</template>

<style scoped>
.vp {
  max-width: 620px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.vp__head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.vp__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.vp__sub {
  margin: -16px 0 0;
  opacity: 0.7;
}
.vp__step {
  background: rgb(var(--fui-theme-surface));
  border: 1px solid rgba(var(--fui-theme-on-background), 0.08);
  border-radius: var(--fui-radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.vp__step-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.vp__step-head h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
}
.vp__done {
  margin: 0;
  opacity: 0.7;
}
</style>
