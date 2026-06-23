<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import ProfileForm from '~/components/forms/profile-form.vue'

definePageMeta({ layout: 'auth' })

const auth = useAuthStore()
const route = useRoute()

function onSaved() {
  if (auth.profileComplete) {
    navigateTo((route.query.redirect as string) || '/dashboard')
  }
}
</script>

<template>
  <div class="setup">
    <h1 class="setup__title">Complete your profile</h1>
    <p class="setup__sub">
      Tell us a bit about {{ auth.isBusiness ? 'your company' : 'yourself' }} to get started.
    </p>
    <ProfileForm :me="auth.me" submit-label="Continue" @saved="onSaved" />
  </div>
</template>

<style scoped>
.setup__title {
  margin: 0 0 6px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.setup__sub {
  opacity: 0.7;
  margin: 0 0 20px;
}
</style>
