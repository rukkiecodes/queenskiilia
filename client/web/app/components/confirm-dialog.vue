<script setup lang="ts">
import { useConfirmState } from '~/composables/use-confirm'

// Single app-wide confirmation dialog, driven by useConfirm(). Mounted once in
// the app shell; replaces window.confirm everywhere.
const { state, settle } = useConfirmState()

// Backdrop click / Escape sets open=false without a button — treat as cancel.
watch(
  () => state.open,
  (open) => {
    if (!open && state.resolve) settle(false)
  },
)
</script>

<template>
  <f-dialog v-model="state.open" blur :width="440">
    <template #header>
      <h3 class="cfd__title">{{ state.title }}</h3>
    </template>

    <p class="cfd__msg">{{ state.message }}</p>

    <template #footer>
      <f-btn variant="text" @click="settle(false)">{{ state.cancelLabel }}</f-btn>
      <f-btn :color="state.danger ? 'danger' : 'primary'" @click="settle(true)">
        {{ state.confirmLabel }}
      </f-btn>
    </template>
  </f-dialog>
</template>

<style scoped>
.cfd__title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.cfd__msg {
  margin: 0;
  line-height: 1.6;
  opacity: 0.8;
}
</style>
