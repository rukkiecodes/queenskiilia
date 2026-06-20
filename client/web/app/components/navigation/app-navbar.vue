<script setup lang="ts">
import NotificationBell from '~/components/navigation/notification-bell.vue'
import UserMenu from '~/components/navigation/user-menu.vue'

const emit = defineEmits<{ toggleDrawer: [] }>()
</script>

<template>
  <f-navbar class="app-navbar">
    <f-btn
      class="app-navbar__burger"
      variant="text"
      icon="menu"
      aria-label="Toggle menu"
      @click="emit('toggleDrawer')"
    />
    <NuxtLink to="/dashboard" class="app-navbar__brand">QueenSkiilia</NuxtLink>
    <f-spacer />
    <NotificationBell />
    <UserMenu />
  </f-navbar>
</template>

<style scoped>
.app-navbar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.app-navbar__brand {
  font-weight: 600;
  letter-spacing: -0.02em;
  color: inherit;
  text-decoration: none;
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
