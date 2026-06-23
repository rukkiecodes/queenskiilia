<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const is404 = computed(() => props.error?.statusCode === 404)
const title = computed(() => (is404.value ? 'Page not found' : 'Something went wrong'))
const message = computed(() =>
  is404.value
    ? "The page you're looking for doesn't exist or has moved."
    : "We hit an unexpected error. Please try again.",
)

useHead({ title: () => `${title.value} · QueenSkiilia` })

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="err">
    <p class="err__code">{{ error?.statusCode ?? 500 }}</p>
    <h1 class="err__title">{{ title }}</h1>
    <p class="err__msg">{{ message }}</p>
    <f-btn color="primary" @click="goHome">Go to home</f-btn>
  </div>
</template>

<style scoped>
.err {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  padding: 24px;
  background: rgb(var(--fui-theme-background));
  color: rgb(var(--fui-theme-on-background));
  font-family: var(--fui-font-family);
}
.err__code {
  margin: 0;
  font-size: 3.5rem;
  font-weight: 700;
  color: rgb(var(--fui-theme-primary));
  letter-spacing: -0.02em;
}
.err__title {
  margin: 0;
  font-weight: 600;
}
.err__msg {
  margin: 0 0 12px;
  opacity: 0.7;
  max-width: 360px;
}
</style>
