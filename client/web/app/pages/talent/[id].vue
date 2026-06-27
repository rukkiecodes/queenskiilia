<script setup lang="ts">
import PortfolioItemCard from '~/components/cards/portfolio-item-card.vue'
import PortfolioDialog from '~/components/portfolio/portfolio-dialog.vue'
import { useUser } from '~/composables/use-user'
import { useStudentPortfolio } from '~/composables/use-portfolio'
import { useAuthStore } from '~/stores/auth'
import type { PortfolioItem } from '~/types/portfolio'

// Public profile: full app shell when signed in, marketing layout for visitors.
definePageMeta({
  middleware: [
    () => {
      const auth = useAuthStore()
      setPageLayout(auth.isAuthenticated ? 'app' : 'public')
    },
  ],
})

const route = useRoute()
const id = computed(() => route.params.id as string)
const auth = useAuthStore()

const { data: user, suspense: userSuspense } = useUser(() => id.value)
const { data: portfolio, suspense: portfolioSuspense } = useStudentPortfolio(() => id.value)
onServerPrefetch(async () => {
  await Promise.allSettled([userSuspense(), portfolioSuspense()])
})

const sp = computed(() => user.value?.studentProfile)
const publicItems = computed(() => (portfolio.value ?? []).filter((i) => i.isPublic))
const name = computed(() => user.value?.fullName ?? 'Talent')
const initial = computed(() => name.value.charAt(0).toUpperCase())

useSeoMeta({
  title: () => `${name.value} — QueenSkiilia`,
  description: () =>
    `${name.value}${sp.value?.skillLevel ? ` · ${sp.value.skillLevel}` : ''} on QueenSkiilia.`,
  ogImage: () =>
    publicItems.value[0]?.imageUrls?.[0] ?? user.value?.avatarUrl ?? undefined,
})

// Showcase dialog (read-only on a public profile — share + likes, no editing).
const dialogOpen = ref(false)
const selected = ref<PortfolioItem | null>(null)
function openItem(item: PortfolioItem) {
  selected.value = item
  dialogOpen.value = true
}
function onUpdated(updated: PortfolioItem) {
  selected.value = updated
  const list = portfolio.value
  if (list) {
    const i = list.findIndex((x) => x.id === updated.id)
    if (i >= 0) list[i] = updated
  }
}
</script>

<template>
  <section class="tp">
    <header class="tp__head">
      <f-avatar :image="user?.avatarUrl ?? undefined" :text="initial" :size="80" circle />
      <div class="tp__id">
        <h1 class="tp__name">
          {{ name }}
          <f-chip v-if="user?.isVerified" color="success">Verified</f-chip>
        </h1>
        <p class="tp__meta">
          <span v-if="sp?.skillLevel">{{ sp.skillLevel }}</span>
          <span v-if="sp?.averageRating != null"> · ★ {{ sp.averageRating.toFixed(1) }}</span>
          <span v-if="user?.country"> · {{ user.country }}</span>
          <span v-if="sp?.university"> · {{ sp.university }}</span>
        </p>
        <div v-if="sp?.skills?.length" class="tp__skills">
          <f-chip v-for="s in sp.skills" :key="s">{{ s }}</f-chip>
        </div>
      </div>
      <f-spacer />
      <ReportButton v-if="auth.isAuthenticated" target-type="user" :target-id="id" />
    </header>

    <section v-if="publicItems.length" class="tp__section">
      <h2 class="tp__h2">Portfolio</h2>
      <div class="tp__grid">
        <PortfolioItemCard v-for="i in publicItems" :key="i.id" :item="i" @open="openItem(i)" />
      </div>
    </section>
    <EmptyState v-else icon="image" title="No public work yet" text="This talent hasn't published any work." />

    <PortfolioDialog
      v-model="dialogOpen"
      :item="selected"
      :talent-name="name"
      :talent-avatar="user?.avatarUrl ?? undefined"
      @updated="onUpdated"
    />
  </section>
</template>

<style scoped>
.tp {
  max-width: 1000px;
  margin: 0 auto;
  padding: clamp(16px, 4vw, 40px) clamp(16px, 4vw, 32px);
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.tp__head {
  display: flex;
  gap: 18px;
  align-items: center;
  flex-wrap: wrap;
}
.tp__name {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 10px;
}
.tp__meta {
  margin: 6px 0 0;
  opacity: 0.7;
}
.tp__skills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.tp__h2 {
  margin: 0 0 14px;
  font-size: 1.05rem;
  font-weight: 600;
}
.tp__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
}
</style>
