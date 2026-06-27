<script setup lang="ts">
import NotificationBell from '~/components/navigation/notification-bell.vue'
import UserMenu from '~/components/navigation/user-menu.vue'

// `desktop` enables the goo-corner junction (only meaningful when the permanent
// sidebar is docked below the bar).
defineProps<{ desktop?: boolean }>()
const emit = defineEmits<{ toggleDrawer: [] }>()
</script>

<template>
  <f-navbar
    class="app-navbar"
    square
    not-line
    :goo-corner="desktop"
    :corner-size="20"
  >
    <template #left>
      <f-btn
        class="app-navbar__burger"
        variant="text"
        icon="menu"
        aria-label="Toggle menu"
        @click="emit('toggleDrawer')"
      />
      <NuxtLink to="/dashboard" class="app-navbar__brand">
        <img src="/logo.png" alt="QueenSkiilia" class="app-navbar__logo" />
        <span class="app-navbar__name">QueenSkiilia</span>
      </NuxtLink>
    </template>
    <template #right>
      <NotificationBell />
      <UserMenu />
    </template>
  </f-navbar>
</template>

<style scoped>
/* Let the goo-corner fillet hang below the bar into the content junction. */
.app-navbar {
  overflow: visible;
}
.app-navbar :deep(.fui-navbar__left),
.app-navbar :deep(.fui-navbar__right) {
  display: flex;
  align-items: center;
  gap: 8px;
}
.app-navbar__brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: inherit;
  text-decoration: none;
}
.app-navbar__logo {
  height: 30px;
  width: auto;
  display: block;
}
.app-navbar__burger {
  display: none;
}
@media (max-width: 767px) {
  .app-navbar__burger {
    display: inline-flex;
  }
}
</style>
