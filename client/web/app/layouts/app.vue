<script setup lang="ts">
import AppNavbar from '~/components/navigation/app-navbar.vue'
import AppSidebar from '~/components/navigation/app-sidebar.vue'

/**
 * Authenticated app shell built on the Fusion UI layout system: <f-layout>
 * coordinates the navbar (top) + sidebar (left) so <f-main> insets itself.
 * Below 768px the sidebar drops to an overlay drawer toggled from the navbar.
 */
const drawerOpen = ref(false)
const isMobile = ref(false)

let mq: MediaQueryList | undefined
function syncMobile() {
  isMobile.value = mq?.matches ?? false
}
onMounted(() => {
  mq = window.matchMedia('(max-width: 767px)')
  syncMobile()
  mq.addEventListener('change', syncMobile)
})
onBeforeUnmount(() => mq?.removeEventListener('change', syncMobile))

// Close the overlay drawer on navigation.
const route = useRoute()
watch(
  () => route.fullPath,
  () => {
    drawerOpen.value = false
  },
)

useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
</script>

<template>
  <f-layout class="app-shell">
    <AppNavbar :desktop="!isMobile" @toggle-drawer="drawerOpen = !drawerOpen" />

    <AppSidebar
      :permanent="!isMobile"
      :open="drawerOpen"
      @update:open="drawerOpen = $event"
      @navigate="drawerOpen = false"
    />

    <f-main>
      <div class="shell__content"><slot /></div>
    </f-main>

    <ConfirmDialog />
  </f-layout>
</template>

<style scoped>
/* Flip the shell colours (only inside the app, not landing/auth/onboarding):
   navbar, sidebar and cards take the soft grey "frame" colour, the main content
   area is white. LIGHT MODE ONLY — in dark mode we keep the theme's own values,
   otherwise these hardcoded light values override the dark theme and you get
   invisible white-on-white text. */
.fui-theme--light .app-shell {
  --fui-theme-background: 255, 255, 255;
  --fui-theme-surface: 241, 244, 248;
}
.shell__content {
  padding: clamp(16px, 3vw, 32px);
}
</style>
