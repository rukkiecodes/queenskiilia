<script setup lang="ts">
defineProps<{ title: string; feature: string; description?: string }>()
</script>

<template>
  <div class="cs">
    <f-icon icon="tool" class="cs__icon" />
    <h1 class="cs__title">{{ title }}</h1>
    <p class="cs__text">{{ description ?? `This area is built in ${feature}.` }}</p>
  </div>
</template>

<style scoped>
.cs {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 50vh;
  text-align: center;
  opacity: 0.85;
}
.cs__icon {
  font-size: 32px;
  color: rgb(var(--fui-theme-primary));
}
.cs__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.cs__text {
  margin: 0;
  opacity: 0.6;
}
</style>
