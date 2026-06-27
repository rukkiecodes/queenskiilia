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
  // Runs before paint: if no saved theme, apply the OS preference's class so the
  // first frame already matches the system (no light→dark flash on startup).
  script: [
    {
      key: 'theme-init',
      tagPosition: 'head',
      tagPriority: 'critical',
      innerHTML:
        "(function(){try{var m=document.cookie.match(/qs\\.theme=(light|dark)/);var t=m?m[1]:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');var e=document.documentElement;e.classList.remove('fui-theme--light','fui-theme--dark');e.classList.add('fui-theme--'+t);}catch(_){}})();",
    },
  ],
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
