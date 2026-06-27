<script setup lang="ts">
// The split-screen brand panel now carries the intro, so onboarding opens
// straight at role selection. Preserve any query (e.g. a post-auth redirect).
const route = useRoute()
await navigateTo({ path: '/onboarding/account-type', query: route.query }, { redirectCode: 302 })
</script>

<template>
  <div />
</template>
