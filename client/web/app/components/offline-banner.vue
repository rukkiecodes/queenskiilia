<script setup lang="ts">
import { useOnline } from '@vueuse/core'

const online = useOnline()
</script>

<template>
  <ClientOnly>
    <div v-if="!online" class="offline" role="status">
      <f-icon icon="wifi-off" /> You're offline — some features may be unavailable.
    </div>
  </ClientOnly>
</template>

<style scoped>
.offline {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 9999px;
  background: rgb(var(--fui-theme-dark));
  color: #fff;
  font-size: 0.85rem;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}
</style>
