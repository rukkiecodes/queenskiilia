<script setup lang="ts">
import AppNavbar from '~/components/navigation/app-navbar.vue'
import AppSidebar from '~/components/navigation/app-sidebar.vue'

/**
 * Authenticated app shell: top navbar + role-aware sidebar that collapses to a
 * CSS-driven off-canvas drawer below 768px.
 */
const drawerOpen = ref(false)

// Close the drawer on route change (mobile).
const route = useRoute()
watch(
  () => route.fullPath,
  () => {
    drawerOpen.value = false
  },
)

// Authenticated app pages are not for indexing.
useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
</script>

<template>
  <div class="shell">
    <AppNavbar class="shell__navbar" @toggle-drawer="drawerOpen = !drawerOpen" />

    <div class="shell__body">
      <div v-if="drawerOpen" class="shell__scrim" @click="drawerOpen = false" />
      <aside class="shell__sidebar" :class="{ 'shell__sidebar--open': drawerOpen }">
        <AppSidebar @navigate="drawerOpen = false" />
      </aside>
      <main class="shell__main">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: rgb(var(--fui-theme-background));
  color: rgb(var(--fui-theme-on-background));
  font-family: var(--fui-font-family);
}
.shell__navbar {
  position: sticky;
  top: 0;
  z-index: 30;
}
.shell__body {
  flex: 1;
  display: flex;
  align-items: stretch;
  position: relative;
  min-height: 0;
}
.shell__sidebar {
  flex: 0 0 auto;
  border-right: 1px solid rgba(var(--fui-theme-on-background), 0.08);
}
.shell__main {
  flex: 1;
  min-width: 0;
  padding: clamp(16px, 3vw, 32px);
  overflow-x: hidden;
}
.shell__scrim {
  display: none;
}

@media (max-width: 767px) {
  .shell__sidebar {
    position: fixed;
    top: 56px;
    bottom: 0;
    left: 0;
    z-index: 40;
    transform: translateX(-100%);
    transition: transform 0.22s ease;
    background: rgb(var(--fui-theme-surface));
  }
  .shell__sidebar--open {
    transform: translateX(0);
  }
  .shell__scrim {
    display: block;
    position: fixed;
    inset: 56px 0 0 0;
    z-index: 35;
    background: rgba(0, 0, 0, 0.4);
  }
}
</style>
