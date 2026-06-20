<script setup lang="ts">
import { useMe } from '~/composables/use-me'
import ProfileForm from '~/components/forms/profile-form.vue'

definePageMeta({ layout: 'app' })

const { me } = useMe()

function onSaved() {
  navigateTo('/profile')
}
</script>

<template>
  <div class="edit">
    <h1 class="edit__title">Edit profile</h1>
    <ProfileForm v-if="me" :me="me" submit-label="Save changes" @saved="onSaved" />
    <p v-else class="edit__loading">Loading…</p>
  </div>
</template>

<style scoped>
.edit {
  max-width: 560px;
}
.edit__title {
  margin: 0 0 20px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.edit__loading {
  opacity: 0.6;
}
</style>
