<script setup lang="ts">
defineProps<{ icon: string; label: string; value: string | number; to?: string }>()
</script>

<template>
  <component :is="to ? 'NuxtLink' : 'div'" :to="to" class="tile" :class="{ 'tile--link': to }">
    <span class="tile__icon"><f-icon :icon="icon" /></span>
    <div class="tile__body">
      <div class="tile__value">{{ value }}</div>
      <div class="tile__label">{{ label }}</div>
    </div>
  </component>
</template>

<style scoped>
.tile {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border-radius: var(--fui-radius-lg);
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  background: rgb(var(--fui-theme-surface));
  text-decoration: none;
  color: inherit;
}
.tile--link {
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.tile--link:hover {
  border-color: rgba(var(--fui-theme-primary), 0.5);
  transform: translateY(-2px);
}
.tile__icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: var(--fui-radius-md);
  background: rgba(var(--fui-theme-primary), 0.12);
  color: rgb(var(--fui-theme-primary));
  font-size: 20px;
}
.tile__value {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.tile__label {
  font-size: 0.82rem;
  opacity: 0.65;
}
</style>
