<script setup lang="ts">
// Public landing entry for the web app (distinct from the marketing landing/ site).
definePageMeta({ layout: 'public' })
useSeoMeta({
  title: 'QueenSkiilia — Verified talent, real projects',
  description:
    'Hire verified student talent or get paid for real work. Skill-tested, escrow-protected, dispute-backed.',
})
</script>

<template>
  <section class="landing">
    <div class="landing__inner">
      <p class="landing__eyebrow">Verified talent ecosystem</p>
      <h1 class="landing__title">Real projects.<br />Verified talent.<br />Escrow-protected pay.</h1>
      <p class="landing__lede">
        QueenSkiilia connects skill-tested students with businesses that need work done — with
        payments held safely in escrow until the job is approved.
      </p>
      <div class="landing__cta">
        <f-btn color="primary" size="large" @click="navigateTo('/onboarding')">Get started</f-btn>
        <f-btn variant="outlined" color="primary" size="large" @click="navigateTo('/onboarding/account-type')">
          I have an account
        </f-btn>
      </div>
    </div>
  </section>
</template>

<style scoped>
.landing {
  padding: clamp(48px, 10vw, 120px) clamp(16px, 5vw, 48px);
}
.landing__inner {
  max-width: 760px;
  margin: 0 auto;
}
.landing__eyebrow {
  color: rgb(var(--fui-theme-primary));
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  font-size: 0.8rem;
  margin: 0 0 16px;
}
.landing__title {
  font-size: clamp(2.4rem, 6vw, 4rem);
  line-height: 1.05;
  letter-spacing: -0.03em;
  font-weight: 600;
  margin: 0 0 20px;
}
.landing__lede {
  font-size: clamp(1.05rem, 2.2vw, 1.35rem);
  line-height: 1.5;
  opacity: 0.7;
  max-width: 560px;
  margin: 0 0 32px;
}
.landing__cta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
