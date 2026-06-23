<script setup lang="ts">
import { useTheme } from '@rukkiecodes/vue'

/**
 * Inject the active theme's CSS variables during SSR so the first paint matches
 * the user's chosen theme (no FOUC). On the client, Fusion UI's theme engine
 * keeps these in sync. `themeClasses` is mirrored onto <html> for components that
 * key off the theme class.
 */
const theme = useTheme()

useHead({
  htmlAttrs: {
    class: () => theme.themeClasses.value,
  },
  style: [
    {
      id: 'fusionui-theme',
      innerHTML: () => theme.styles.value,
      tagPriority: 'critical',
    },
  ],
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <OfflineBanner />
  </div>
</template>
