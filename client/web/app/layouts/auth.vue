<script setup lang="ts">
// Centered, chrome-light layout for onboarding / login / verify.
useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
</script>

<template>
  <div class="auth-layout">
    <header class="auth-layout__brand">
      <NuxtLink to="/">QueenSkiilia</NuxtLink>
    </header>
    <main class="auth-layout__main">
      <div class="auth-layout__card">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100dvh;
  background: rgb(var(--fui-theme-background));
  color: rgb(var(--fui-theme-on-background));
  font-family: var(--fui-font-family);
  display: flex;
  flex-direction: column;
}
.auth-layout__brand {
  padding: 20px 24px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.auth-layout__brand a {
  color: inherit;
  text-decoration: none;
}
.auth-layout__main {
  flex: 1;
  display: grid;
  place-items: center;
  padding: 24px;
}
.auth-layout__card {
  width: 100%;
  max-width: 380px;
}
</style>
