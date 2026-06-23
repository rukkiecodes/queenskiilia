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
  if (!authFlow.email || !authFlow.accountType) {
    navigateTo('/onboarding/account-type')
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
  if (resendIn.value > 0 || !authFlow.email || !authFlow.accountType) return
  resendOtp(
    { email: authFlow.email, accountType: authFlow.accountType },
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
  <div class="verify">
    <h1 class="verify__title">Enter your code</h1>
    <p class="verify__sub">
      Sent to <strong>{{ authFlow.email }}</strong> · expires in {{ countdown }}
    </p>

    <f-alert v-if="error" type="error" variant="flat" class="verify__alert">{{ error }}</f-alert>

    <div class="verify__otp">
      <f-otp
        v-model="otp"
        :length="6"
        type="number"
        autofocus
        :state="error ? 'danger' : undefined"
        :disabled="verifying"
      />
    </div>

    <f-btn color="primary" block :loading="verifying" class="verify__btn" @click="submit">Verify</f-btn>
    <f-btn variant="text" block :disabled="resendIn > 0" @click="resend">
      {{ resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code' }}
    </f-btn>
  </div>
</template>

<style scoped>
.verify__title {
  margin: 0 0 8px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.verify__sub {
  opacity: 0.7;
  margin: 0 0 20px;
}
.verify__alert {
  margin-bottom: 16px;
}
.verify__otp {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}
.verify__btn {
  margin-bottom: 8px;
}
</style>
