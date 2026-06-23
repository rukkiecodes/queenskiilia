<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const slides = [
  { icon: 'search', title: 'Find real work', text: 'Browse open projects matched to your verified skills.' },
  { icon: 'shield', title: 'Protected pay', text: 'Funds are held in escrow and released on approval.' },
  { icon: 'award', title: 'Prove your skills', text: 'Pass skill tests, build a portfolio, climb the leaderboard.' },
]

const index = ref(0)
const current = computed(() => slides[index.value]!)
const isLast = computed(() => index.value === slides.length - 1)

function next() {
  if (!isLast.value) index.value++
  else go()
}
function prev() {
  if (index.value > 0) index.value--
}
function go() {
  navigateTo('/onboarding/account-type')
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight') next()
  if (e.key === 'ArrowLeft') prev()
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="onb">
    <div class="onb__card">
      <div class="onb__icon"><f-icon :icon="current.icon" /></div>
      <h2 class="onb__title">{{ current.title }}</h2>
      <p class="onb__text">{{ current.text }}</p>
    </div>

    <div class="onb__dots">
      <button
        v-for="(s, i) in slides"
        :key="i"
        type="button"
        class="onb__dot"
        :class="{ 'onb__dot--on': i === index }"
        :aria-label="`Go to slide ${i + 1}`"
        @click="index = i"
      />
    </div>

    <div class="onb__actions">
      <f-btn variant="text" @click="go">Skip</f-btn>
      <f-btn color="primary" @click="next">{{ isLast ? 'Get started' : 'Next' }}</f-btn>
    </div>
  </div>
</template>

<style scoped>
.onb {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  text-align: center;
}
.onb__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  min-height: 200px;
  justify-content: center;
}
.onb__icon {
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  border-radius: var(--fui-radius-lg);
  background: rgba(var(--fui-theme-primary), 0.12);
  color: rgb(var(--fui-theme-primary));
  font-size: 28px;
}
.onb__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.onb__text {
  margin: 0;
  opacity: 0.7;
  max-width: 320px;
}
.onb__dots {
  display: flex;
  gap: 8px;
}
.onb__dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  border: 0;
  padding: 0;
  cursor: pointer;
  background: rgba(var(--fui-theme-on-background), 0.2);
  transition: width 0.2s ease, background 0.2s ease;
}
.onb__dot--on {
  width: 22px;
  background: rgb(var(--fui-theme-primary));
}
.onb__actions {
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}
</style>
