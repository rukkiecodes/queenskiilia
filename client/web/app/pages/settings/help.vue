<script setup lang="ts">
definePageMeta({ layout: 'app' })

const faqs = [
  { q: 'How do payments work?', a: 'Businesses fund a project into escrow after selecting a student. Funds are released to the student only when the work is approved.' },
  { q: 'How do I raise my skill level?', a: 'Take a timed skill assessment under Skill tests. Passing raises your level and unlocks higher-tier projects.' },
  { q: 'What if there is a problem with a project?', a: 'Open the project workspace and raise a dispute. This freezes the escrow until our team reviews it.' },
  { q: 'How do I get verified?', a: 'Go to Verification under your profile and submit an ID document and a selfie. A verified badge appears once approved.' },
]
</script>

<template>
  <div class="help">
    <button type="button" class="help__back" @click="navigateTo('/settings')">
      <f-icon icon="arrow-left" /> Settings
    </button>
    <h1 class="help__title">Help &amp; support</h1>

    <div class="help__faqs">
      <details v-for="(f, i) in faqs" :key="i" class="help__faq">
        <summary>{{ f.q }}</summary>
        <p>{{ f.a }}</p>
      </details>
    </div>

    <p class="help__contact">
      Still need help? Email <a href="mailto:support@queenskilla.com">support@queenskilla.com</a>.
    </p>
  </div>
</template>

<style scoped>
.help {
  max-width: 620px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.help__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: rgb(var(--fui-theme-primary));
  cursor: pointer;
  font: inherit;
  padding: 0;
  align-self: flex-start;
}
.help__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.help__faqs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.help__faq {
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  border-radius: var(--fui-radius-md);
  padding: 12px 16px;
  background: rgb(var(--fui-theme-surface));
}
.help__faq summary {
  cursor: pointer;
  font-weight: 600;
}
.help__faq p {
  margin: 8px 0 0;
  opacity: 0.8;
}
.help__contact a {
  color: rgb(var(--fui-theme-primary));
}
</style>
