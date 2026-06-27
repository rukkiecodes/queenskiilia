<script setup lang="ts">
// Temporarily disabled — re-enable once proper skill assessments are designed.
// The previous implementation is preserved in git history.
definePageMeta({ layout: 'app', middleware: 'role', requiresRole: 'student' })
useHead({ title: 'Skill tests — Coming soon' })
</script>

<template>
  <div class="soon">
    <div class="soon__card">
      <f-icon icon="award" class="soon__icon" />
      <h1 class="soon__title">Skill tests</h1>
      <f-chip color="warning" class="soon__chip">Coming soon</f-chip>
      <p class="soon__text">
        We're building proper, fair assessments to verify your skills. This page will reopen once
        they're ready.
      </p>
      <f-btn variant="outlined" @click="navigateTo('/dashboard')">Back to dashboard</f-btn>
    </div>
  </div>
</template>

<style scoped>
.soon {
  min-height: 60vh;
  display: grid;
  place-items: center;
}
.soon__card {
  max-width: 440px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 44px 30px;
  border: 1px dashed rgba(var(--fui-theme-on-background), 0.22);
  border-radius: 22px;
  background: rgba(var(--fui-theme-on-background), 0.02);
  /* Greyed out — clearly inactive. */
  opacity: 0.7;
  filter: grayscale(0.4);
}
.soon__icon {
  font-size: 42px;
  opacity: 0.5;
}
.soon__title {
  margin: 0;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.soon__chip {
  opacity: 0.9;
}
.soon__text {
  margin: 0;
  opacity: 0.7;
  line-height: 1.55;
}
</style>
