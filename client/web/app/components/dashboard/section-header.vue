<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <div class="sh">
    <h2 class="sh__title">{{ title }}</h2>
    <div v-if="$slots.action" class="sh__action"><slot name="action" /></div>
  </div>
</template>

<style scoped>
.sh {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 8px 0;
}
.sh__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
}
</style>
