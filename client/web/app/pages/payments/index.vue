<script setup lang="ts">
import EscrowCard from '~/components/cards/escrow-card.vue'
import FinancialDisclaimer from '~/components/financial-disclaimer.vue'
import { useMyEscrows, useReleaseFunds } from '~/composables/use-payments'

definePageMeta({ layout: 'app', middleware: 'role', requiresRole: 'business' })

const { data: escrows, isPending, suspense } = useMyEscrows()
onServerPrefetch(() => suspense().catch(() => {}))

const { mutate: release, isPending: releasing, variables } = useReleaseFunds()
const { confirm } = useConfirm()
async function onRelease(projectId: string) {
  const ok = await confirm({
    title: 'Release funds?',
    message: 'Release the escrow funds to the student? This cannot be undone.',
    confirmLabel: 'Release funds',
  })
  if (ok) release(projectId)
}

const heldTotal = computed(() =>
  (escrows.value ?? []).filter((e) => e.status === 'held').reduce((s, e) => s + e.amount, 0),
)
const currency = computed(() => escrows.value?.[0]?.currency ?? '')
</script>

<template>
  <div class="pay">
    <header class="pay__head">
      <div>
        <h1 class="pay__title">Payments</h1>
        <p v-if="heldTotal > 0" class="pay__held">{{ currency }} {{ heldTotal.toLocaleString() }} held in escrow</p>
      </div>
    </header>

    <FinancialDisclaimer />

    <p v-if="isPending" class="pay__status">Loading…</p>

    <div v-else-if="escrows && escrows.length" class="pay__grid">
      <EscrowCard
        v-for="e in escrows"
        :key="e.id"
        :escrow="e"
        can-manage
        :releasing="releasing && variables === e.projectId"
        @release="onRelease(e.projectId)"
      />
    </div>

    <EmptyState
      v-else
      icon="credit-card"
      title="No escrow accounts yet"
      text="Fund a project after selecting a student and it'll appear here."
    />
  </div>
</template>

<style scoped>
.pay {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.pay__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.pay__held {
  margin: 4px 0 0;
  color: rgb(var(--fui-theme-primary));
  font-weight: 600;
}
.pay__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}
.pay__status {
  opacity: 0.6;
}
</style>
