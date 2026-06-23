<script setup lang="ts">
import PortfolioItemCard from '~/components/cards/portfolio-item-card.vue'
import { useMyPortfolio, useSetVisibility } from '~/composables/use-portfolio'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'app', middleware: 'role', requiresRole: 'student' })

const auth = useAuthStore()
const { data: items, isPending, suspense } = useMyPortfolio()
onServerPrefetch(() => suspense().catch(() => {}))

const { mutate: setVisibility, isPending: saving, variables } = useSetVisibility()
function toggle(id: string, value: boolean) {
  setVisibility({ id, isPublic: value })
}

const publicUrl = computed(() => (auth.user ? `/talent/${auth.user.id}` : null))
</script>

<template>
  <div class="pf">
    <header class="pf__head">
      <div>
        <h1 class="pf__title">Portfolio</h1>
        <p class="pf__sub">Completed projects appear here automatically. Toggle each one public or private.</p>
      </div>
      <f-btn v-if="publicUrl" variant="outlined" prepend-icon="external-link" @click="navigateTo(publicUrl)">
        View public page
      </f-btn>
    </header>

    <p v-if="isPending" class="pf__status">Loading…</p>

    <div v-else-if="items && items.length" class="pf__grid">
      <PortfolioItemCard
        v-for="i in items"
        :key="i.id"
        :item="i"
        editable
        :saving="saving && variables?.id === i.id"
        @toggle-visibility="(v) => toggle(i.id, v)"
      />
    </div>

    <EmptyState
      v-else
      icon="image"
      title="No portfolio items yet"
      text="Finish a project and it'll be added here automatically."
    >
      <f-btn color="primary" @click="navigateTo('/projects')">Find work</f-btn>
    </EmptyState>
  </div>
</template>

<style scoped>
.pf {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.pf__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.pf__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.pf__sub {
  margin: 6px 0 0;
  opacity: 0.7;
  max-width: 460px;
}
.pf__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
.pf__status {
  opacity: 0.6;
}
</style>
