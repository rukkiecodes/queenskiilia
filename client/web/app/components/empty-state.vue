<script setup lang="ts">
defineProps<{ icon?: string; title: string; text?: string }>()
</script>

<template>
  <div class="empty">
    <f-icon :icon="icon ?? 'inbox'" class="empty__icon" />
    <h3 class="empty__title">{{ title }}</h3>
    <p v-if="text" class="empty__text">{{ text }}</p>
    <div v-if="$slots.default" class="empty__action"><slot /></div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px 16px;
  text-align: center;
}
.empty__icon {
  font-size: 30px;
  opacity: 0.5;
}
.empty__title {
  margin: 4px 0 0;
  font-weight: 600;
}
.empty__text {
  margin: 0;
  opacity: 0.6;
  max-width: 320px;
}
.empty__action {
  margin-top: 8px;
}
</style>
