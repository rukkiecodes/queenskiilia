<script setup lang="ts">
definePageMeta({ layout: 'app' })
</script>

<template>
  <div class="about">
    <button type="button" class="about__back" @click="navigateTo('/settings')">
      <f-icon icon="arrow-left" /> Settings
    </button>
    <h1 class="about__title">About QueenSkiilia</h1>
    <p class="about__lede">
      QueenSkiilia connects verified, skill-tested student talent with businesses that need real
      work done — with payments protected in escrow until the job is approved.
    </p>
    <dl class="about__facts">
      <div><dt>Platform</dt><dd>Web (Nuxt) · iOS &amp; Android</dd></div>
      <div><dt>Payments</dt><dd>Escrow via Paystack</dd></div>
      <div><dt>Support</dt><dd><NuxtLink to="/settings/help">Help &amp; support</NuxtLink></dd></div>
    </dl>
  </div>
</template>

<style scoped>
.about {
  max-width: 620px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.about__back {
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
.about__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.about__lede {
  margin: 0;
  line-height: 1.6;
  opacity: 0.85;
}
.about__facts {
  margin: 0;
  display: grid;
  gap: 10px;
}
.about__facts dt {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  opacity: 0.5;
}
.about__facts dd {
  margin: 2px 0 0;
  font-weight: 600;
}
.about__facts a {
  color: rgb(var(--fui-theme-primary));
  text-decoration: none;
}
</style>
