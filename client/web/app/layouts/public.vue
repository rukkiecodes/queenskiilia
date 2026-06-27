<script setup lang="ts">
// Marketing-grade layout for SSR public pages (talent profiles, portfolios, open projects).
</script>

<template>
  <div class="public-layout">
    <header class="public-layout__header">
      <NuxtLink to="/" class="public-layout__brand">
        <img src="/logo.png" alt="QueenSkiilia" class="public-layout__logo" />
        <span>QueenSkiilia</span>
      </NuxtLink>
      <nav class="public-layout__nav">
        <f-btn variant="text" size="small" @click="navigateTo('/login')">Sign in</f-btn>
        <f-btn color="primary" size="small" @click="navigateTo('/onboarding')">Get started</f-btn>
      </nav>
    </header>

    <main class="public-layout__main">
      <slot />
    </main>

    <footer class="public-layout__footer">
      <span>© QueenSkiilia</span>
      <span class="public-layout__links">
        <NuxtLink to="/legal/terms">Terms</NuxtLink>
        <NuxtLink to="/legal/privacy">Privacy</NuxtLink>
      </span>
    </footer>
  </div>
</template>

<style scoped>
.public-layout {
  min-height: 100dvh;
  background: rgb(var(--fui-theme-background));
  color: rgb(var(--fui-theme-on-background));
  font-family: var(--fui-font-family);
  display: flex;
  flex-direction: column;
}
.public-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px clamp(16px, 5vw, 48px);
  border-bottom: 1px solid rgba(var(--fui-theme-on-background), 0.08);
}
.public-layout__brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: inherit;
  text-decoration: none;
}
.public-layout__logo {
  height: 30px;
  width: auto;
  display: block;
}
.public-layout__nav {
  display: flex;
  align-items: center;
  gap: 16px;
}
.public-layout__nav a {
  color: inherit;
  text-decoration: none;
  opacity: 0.8;
}
.public-layout__main {
  flex: 1;
}
.public-layout__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px clamp(16px, 5vw, 48px);
  border-top: 1px solid rgba(var(--fui-theme-on-background), 0.08);
  font-size: 0.85rem;
  opacity: 0.7;
}
.public-layout__links {
  display: flex;
  gap: 16px;
}
.public-layout__links a {
  color: inherit;
  text-decoration: none;
}
</style>
