<script setup lang="ts">
// Split auth / onboarding layout (Arcana style): the form (left) beside an inset,
// rounded photo panel (right), built on Fusion UI's <f-auth-layout>.
useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
</script>

<template>
  <f-auth-layout aside-position="right" image="/auth/collaborate.jpg">
    <template #aside>
      <NuxtLink to="/" class="brand__logo">
        <img src="/logo.png" alt="QueenSkiilia" />
        <span>QueenSkiilia</span>
      </NuxtLink>

      <div class="brand__body">
        <span class="brand__eyebrow">The verified talent ecosystem</span>
        <h2 class="brand__headline">Welcome to QueenSkiilia</h2>
        <p class="brand__text">
          The world's first verified talent ecosystem — where people prove their skills and
          businesses hire with confidence, every payment held in escrow until the work is approved.
        </p>
        <p class="brand__count">Prove it. Work. Earn.</p>
      </div>

      <div class="brand__card">
        <h3 class="brand__card-title">The right talent, in the right place</h3>
        <div class="brand__card-row">
          <p class="brand__card-text">Be among the first to build something great with confidence.</p>
          <div class="brand__avatars" aria-hidden="true">
            <span class="brand__avatar" />
            <span class="brand__avatar" />
            <span class="brand__avatar" />
            <span class="brand__avatar brand__avatar--more">9+</span>
          </div>
        </div>
      </div>
    </template>

    <slot />
  </f-auth-layout>
</template>

<style scoped>
.brand__logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #fff;
  text-decoration: none;
}
.brand__logo img {
  height: 32px;
  width: auto;
}
.brand__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.brand__eyebrow {
  font-size: 0.9rem;
  font-weight: 600;
  opacity: 0.75;
}
.brand__headline {
  margin: 0;
  font-size: clamp(1.8rem, 2.6vw, 2.4rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
}
.brand__text {
  margin: 0;
  max-width: 460px;
  opacity: 0.78;
  line-height: 1.55;
  font-size: 0.95rem;
}
.brand__count {
  margin: 0;
  opacity: 0.65;
  font-size: 0.92rem;
}
.brand__card {
  background: rgba(255, 255, 255, 0.09);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 24px 26px;
}
.brand__card-title {
  margin: 0 0 14px;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.25;
}
.brand__card-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}
.brand__card-text {
  margin: 0;
  opacity: 0.78;
  line-height: 1.5;
  font-size: 0.9rem;
  max-width: 230px;
}
.brand__avatars {
  display: flex;
  flex-shrink: 0;
}
.brand__avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 2px solid rgba(20, 22, 26, 0.9);
  margin-left: -10px;
  background: center / cover no-repeat url('/auth/collaborate.jpg');
  display: grid;
  place-items: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: #fff;
}
.brand__avatar:first-child {
  margin-left: 0;
}
.brand__avatar--more {
  background: rgb(var(--fui-theme-primary));
}
</style>
