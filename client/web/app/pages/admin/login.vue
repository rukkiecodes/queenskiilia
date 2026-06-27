<script setup lang="ts">
import { adminLogin, useAdminToken } from '~/lib/admin-api'

definePageMeta({ layout: false })
useSeoMeta({ title: 'Admin sign in — QueenSkiilia' })

// Already signed in → skip to the console.
onMounted(() => {
  if (useAdminToken().value) navigateTo('/admin')
})

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  if (!email.value || !password.value) return
  error.value = ''
  loading.value = true
  try {
    await adminLogin(email.value.trim(), password.value)
    await navigateTo('/admin')
  } catch (e: any) {
    error.value = e?.data?.error || e?.message || 'Sign in failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <f-auth-layout image="/auth/collaborate.jpg">
    <template #aside>
      <NuxtLink to="/" class="brand__logo">
        <img src="/logo.png" alt="QueenSkiilia" />
        <span>QueenSkiilia</span>
      </NuxtLink>
      <div class="brand__body">
        <span class="brand__eyebrow">Admin console</span>
        <h2 class="brand__headline">Staff sign in</h2>
        <p class="brand__text">
          Review verifications, resolve disputes, action reports and manage users.
        </p>
      </div>
    </template>

    <div class="auth-form">
      <div class="auth-form__head">
        <h1 class="auth-form__title">Admin sign in</h1>
        <p class="auth-form__sub">Authorized staff only.</p>
      </div>

      <f-alert v-if="error" type="error" variant="flat" class="auth-form__alert">{{ error }}</f-alert>

      <form class="auth-form__form" @submit.prevent="onSubmit">
        <f-input
          v-model="email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          prepend-icon="mail"
        />
        <f-input
          v-model="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          prepend-icon="lock"
        />
        <f-btn color="dark" block size="large" type="submit" :loading="loading">Sign in</f-btn>
      </form>
    </div>
  </f-auth-layout>
</template>

<style scoped>
.brand__logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
  text-decoration: none;
  margin-bottom: 8px;
}
.brand__logo img {
  height: 32px;
}
.brand__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.brand__eyebrow {
  font-size: 0.9rem;
  font-weight: 600;
  opacity: 0.75;
  color: #fff;
}
.brand__headline {
  margin: 0;
  font-size: clamp(1.8rem, 2.6vw, 2.4rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #fff;
}
.brand__text {
  margin: 0;
  max-width: 460px;
  opacity: 0.78;
  line-height: 1.55;
  font-size: 0.95rem;
  color: #fff;
}
.auth-form {
  display: flex;
  flex-direction: column;
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
</style>
