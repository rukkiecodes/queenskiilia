<script setup lang="ts">
import { useAuthFlowStore } from '~/stores/auth-flow'
import { useAuthStore } from '~/stores/auth'
import { useRequestOtp, useVerifyOtp } from '~/composables/use-auth'

definePageMeta({ layout: 'auth' })

const authFlow = useAuthFlowStore()
const auth = useAuthStore()
const route = useRoute()
const otp = ref('')
const error = ref('')
const expiresIn = ref(600) // 10 minutes
const resendIn = ref(60)
let expiryTimer: ReturnType<typeof setInterval> | undefined
let resendTimer: ReturnType<typeof setInterval> | undefined

const { mutate: verify, isPending: verifying } = useVerifyOtp()
const { mutate: resendOtp } = useRequestOtp()

const countdown = computed(() => {
  const m = Math.floor(expiresIn.value / 60)
  const s = expiresIn.value % 60
  return `${m}:${String(s).padStart(2, '0')}`
})

onMounted(() => {
  if (!authFlow.email) {
    navigateTo('/login')
    return
  }
  expiryTimer = setInterval(() => {
    if (expiresIn.value > 0) expiresIn.value--
  }, 1000)
  resendTimer = setInterval(() => {
    if (resendIn.value > 0) resendIn.value--
  }, 1000)
})
onUnmounted(() => {
  clearInterval(expiryTimer)
  clearInterval(resendTimer)
})

function submit() {
  if (otp.value.length < 6) {
    error.value = 'Enter the 6-digit code'
    return
  }
  error.value = ''
  verify(
    { email: authFlow.email!, otp: otp.value },
    {
      onSuccess: () => {
        authFlow.reset()
        if (!auth.profileComplete) {
          navigateTo('/onboarding/profile')
          return
        }
        navigateTo((route.query.redirect as string) || '/dashboard')
      },
      onError: (e: unknown) => {
        error.value = (e as { data?: { error?: string } })?.data?.error ?? 'Invalid or expired code'
        otp.value = ''
      },
    },
  )
}

// Auto-submit once all six digits are entered.
watch(otp, (v) => {
  if (v.length === 6) submit()
})

function resend() {
  if (resendIn.value > 0 || !authFlow.email) return
  resendOtp(
    { email: authFlow.email, accountType: authFlow.accountType ?? undefined },
    {
      onSuccess: () => {
        resendIn.value = 60
        expiresIn.value = 600
        error.value = ''
      },
    },
  )
}
</script>

<template>
  <div class="step">
    <header class="step__head">
      <span class="step__eyebrow">Verify code</span>
      <h1 class="step__title">Enter your code</h1>
      <p class="step__sub">
        Sent to <strong>{{ authFlow.email }}</strong> · expires in {{ countdown }}
      </p>
    </header>

    <f-alert v-if="error" type="error" variant="flat" class="step__alert">{{ error }}</f-alert>

    <div class="step__otp">
      <f-otp
        v-model="otp"
        :length="6"
        type="number"
        autofocus
        :state="error ? 'danger' : undefined"
        :disabled="verifying"
      />
    </div>

    <f-btn color="primary" block size="large" :loading="verifying" class="step__btn" @click="submit">Verify</f-btn>
    <f-btn variant="text" block :disabled="resendIn > 0" @click="resend">
      {{ resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code' }}
    </f-btn>
  </div>
</template>

<style scoped>
.step__head {
  margin-bottom: 24px;
}
.step__eyebrow {
  display: inline-block;
  margin-bottom: 10px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgb(var(--fui-theme-primary));
}
.step__title {
  margin: 0 0 8px;
  font-size: clamp(1.5rem, 3vw, 1.95rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.15;
}
.step__sub {
  margin: 0;
  opacity: 0.7;
}
.step__alert {
  margin-bottom: 16px;
}
.step__otp {
  display: flex;
  justify-content: center;
  margin: 24px 0 20px;
}
.step__btn {
  margin-bottom: 8px;
}
</style>
