<script setup lang="ts">
// Thin wrapper over the Fusion UI <f-empty-state> so existing <EmptyState> call
// sites keep working while the styling/markup lives in the framework.
defineProps<{ icon?: string; title: string; text?: string }>()
</script>

<template>
  <f-empty-state :icon="icon" :title="title" :text="text"><slot /></f-empty-state>
</template>
