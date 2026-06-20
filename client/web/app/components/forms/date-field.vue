<script setup lang="ts">
const model = defineModel<string>({ default: '' })
defineProps<{ label?: string; min?: string }>()
</script>

<template>
  <f-input v-model="model" type="date" :label="label ?? 'Date'" :min="min" />
</template>
