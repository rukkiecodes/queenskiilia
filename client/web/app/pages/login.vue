<script setup lang="ts">
import { z } from 'zod'
import { useAuthFlowStore } from '~/stores/auth-flow'
import { useRequestOtp } from '~/composables/use-auth'

definePageMeta({ layout: 'auth' })

const authFlow = useAuthFlowStore()
const route = useRoute()
const email = ref(authFlow.email ?? '')
const error = ref('')

const schema = z
  .string()
  .trim()
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address')

const { mutate: send, isPending: sending } = useRequestOtp()

onMounted(() => {
  if (!authFlow.accountType) {
    navigateTo({ path: '/onboarding/account-type', query: route.query })
  }
})

function submit() {
  const parsed = schema.safeParse(email.value)
  if (!parsed.success) {
    error.value = parsed.error.issues[0]?.message ?? 'Invalid email address'
    return
  }
  if (!authFlow.accountType) {
    navigateTo('/onboarding/account-type')
    return
  }
  error.value = ''
  const clean = parsed.data
  authFlow.setEmail(clean)
  send(
    { email: clean, accountType: authFlow.accountType },
    {
      onSuccess: () => navigateTo({ path: '/verify', query: route.query }),
      onError: (e: unknown) => {
        error.value =
          (e as { data?: { error?: string } })?.data?.error ??
          'Could not send the code. Please try again.'
      },
    },
  )
}
</script>

<template>
  <div class="login">
    <h1 class="login__title">Enter your email</h1>
    <p class="login__sub">We'll send you a 6-digit sign-in code.</p>

    <f-alert v-if="error" type="error" variant="flat" class="login__alert">{{ error }}</f-alert>

    <form class="login__form" @submit.prevent="submit">
      <f-input v-model="email" type="email" label="Email" placeholder="you@example.com" prepend-icon="mail" />
      <f-btn color="primary" block type="submit" :loading="sending">Send code</f-btn>
    </form>

    <f-btn variant="text" block class="login__back" @click="navigateTo('/onboarding/account-type')">Back</f-btn>
  </div>
</template>

<style scoped>
.login__title {
  margin: 0 0 8px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.login__sub {
  opacity: 0.7;
  margin: 0 0 20px;
}
.login__alert {
  margin-bottom: 16px;
}
.login__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.login__back {
  margin-top: 8px;
}
</style>
