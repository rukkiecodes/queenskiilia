<script setup lang="ts">
import { z } from 'zod'
import { useAuthFlowStore } from '~/stores/auth-flow'
import { useRequestOtp } from '~/composables/use-auth'

definePageMeta({ layout: 'auth' })

const authFlow = useAuthFlowStore()
const route = useRoute()
const email = ref(authFlow.email ?? '')
const error = ref('')

// Signing up = a role was picked in onboarding; otherwise it's a plain login
// (no role to choose — the account already carries its type).
const isSignup = computed(() => !!authFlow.accountType)

const schema = z
  .string()
  .trim()
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address')

const { mutate: send, isPending: sending } = useRequestOtp()

function submit() {
  const parsed = schema.safeParse(email.value)
  if (!parsed.success) {
    error.value = parsed.error.issues[0]?.message ?? 'Invalid email address'
    return
  }
  error.value = ''
  const clean = parsed.data
  authFlow.setEmail(clean)
  send(
    // accountType only when signing up; omitted for login.
    { email: clean, accountType: authFlow.accountType ?? undefined },
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
  <div class="auth-form">
    <NuxtLink to="/" class="auth-form__logo">QueenSkiilia</NuxtLink>

    <header class="auth-form__head">
      <h1 class="auth-form__title">{{ isSignup ? 'Create your account' : 'Sign in' }}</h1>
      <p class="auth-form__sub">
        {{
          isSignup
            ? "Enter your email — we'll send a code to confirm it's you."
            : "Enter your email and we'll send you a sign-in code."
        }}
      </p>
    </header>

    <f-alert v-if="error" type="error" variant="flat" class="auth-form__alert">{{ error }}</f-alert>

    <form class="auth-form__form" @submit.prevent="submit">
      <f-input
        v-model="email"
        type="email"
        label="Email address"
        placeholder="you@example.com"
        prepend-icon="mail"
      />
      <f-btn color="dark" block size="large" type="submit" :loading="sending">
        {{ isSignup ? 'Continue' : 'Sign in' }}
      </f-btn>
    </form>

    <p class="auth-form__alt">
      <template v-if="isSignup">
        <NuxtLink to="/onboarding/account-type">← Change account type</NuxtLink>
      </template>
      <template v-else>
        Don't have an account?
        <NuxtLink to="/onboarding">Sign up</NuxtLink>
      </template>
    </p>
  </div>
</template>

<style scoped>
.auth-form {
  display: flex;
  flex-direction: column;
}
.auth-form__logo {
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: inherit;
  text-decoration: none;
  margin-bottom: 40px;
}
.auth-form__head {
  margin-bottom: 24px;
}
.auth-form__title {
  margin: 0 0 8px;
  font-size: clamp(1.7rem, 3.4vw, 2.1rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
}
.auth-form__sub {
  margin: 0;
  opacity: 0.65;
}
.auth-form__alert {
  margin-bottom: 16px;
}
.auth-form__form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.auth-form__alt {
  margin: 22px 0 0;
  font-size: 0.9rem;
  opacity: 0.8;
}
.auth-form__alt a {
  color: rgb(var(--fui-theme-primary));
  font-weight: 600;
  text-decoration: none;
}
</style>
