<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import ProfileForm from '~/components/forms/profile-form.vue'

// Standalone, focused wizard page — wider than the auth split so the form breathes.
definePageMeta({ layout: false })

const auth = useAuthStore()
const route = useRoute()
useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

function onSaved() {
  if (auth.profileComplete) {
    navigateTo((route.query.redirect as string) || '/dashboard')
  }
}
</script>

<template>
  <div class="setup">
    <header class="setup__bar">
      <NuxtLink to="/" class="setup__brand">QueenSkiilia</NuxtLink>
    </header>

    <main class="setup__main">
      <div class="setup__card">
        <header class="setup__head">
          <span class="setup__eyebrow">Almost there</span>
          <h1 class="setup__title">Complete your profile</h1>
          <p class="setup__sub">
            Tell us a bit about {{ auth.isBusiness ? 'your company' : 'yourself' }} to get started.
          </p>
        </header>

        <ProfileForm :me="auth.me" submit-label="Finish" stepped @saved="onSaved" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.setup {
  min-height: 100dvh;
  background: rgb(var(--fui-theme-background));
  color: rgb(var(--fui-theme-on-background));
  font-family: var(--fui-font-family);
}
.setup__bar {
  padding: 18px clamp(16px, 4vw, 40px);
}
.setup__brand {
  font-weight: 600;
  letter-spacing: -0.02em;
  color: inherit;
  text-decoration: none;
}
.setup__main {
  display: flex;
  justify-content: center;
  padding: clamp(8px, 2vw, 20px) clamp(16px, 4vw, 40px) 72px;
}
.setup__card {
  width: 100%;
  max-width: 660px;
  background: rgb(var(--fui-theme-surface));
  border: 1px solid rgba(var(--fui-theme-on-background), 0.08);
  border-radius: 22px;
  padding: clamp(24px, 4vw, 40px);
  box-shadow: 0 10px 34px rgba(0, 0, 0, 0.05);
}
.setup__head {
  margin-bottom: 28px;
}
.setup__eyebrow {
  display: inline-block;
  margin-bottom: 10px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgb(var(--fui-theme-primary));
}
.setup__title {
  margin: 0 0 8px;
  font-size: clamp(1.6rem, 3vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.025em;
}
.setup__sub {
  margin: 0;
  opacity: 0.65;
}
</style>
