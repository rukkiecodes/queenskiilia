<script setup lang="ts">
import { format } from 'date-fns'
import type { EscrowAccount } from '~/types/payment'

const props = defineProps<{ escrow: EscrowAccount; canManage?: boolean; releasing?: boolean }>()
const emit = defineEmits<{ release: [] }>()

const statusColor: Record<string, string | undefined> = {
  pending: 'warning',
  held: 'primary',
  released: 'success',
  refunded: undefined,
  disputed: 'danger',
}
const created = computed(() => {
  const d = new Date(props.escrow.createdAt)
  return Number.isNaN(d.getTime()) ? '' : format(d, 'PP')
})
</script>

<template>
  <article class="ec">
    <div class="ec__head">
      <div>
        <span class="ec__amount">{{ escrow.currency }} {{ escrow.amount.toLocaleString() }}</span>
        <span v-if="escrow.platformFee != null" class="ec__fee">
          incl. {{ escrow.currency }} {{ escrow.platformFee.toLocaleString() }} fee
        </span>
      </div>
      <f-status-pill :color="statusColor[escrow.status]">{{ statusLabel(escrow.status) }}</f-status-pill>
    </div>

    <p class="ec__meta">
      <NuxtLink :to="`/projects/${escrow.projectId}`" class="ec__link">View project</NuxtLink>
      · {{ created }} · {{ escrow.gateway }}
    </p>

    <div v-if="canManage && escrow.status === 'held'" class="ec__actions">
      <f-btn color="primary" size="small" :loading="releasing" @click="emit('release')">
        Release funds
      </f-btn>
    </div>
  </article>
</template>

<style scoped>
.ec {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px;
  border-radius: var(--fui-radius-lg);
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  background: rgb(var(--fui-theme-surface));
}
.ec__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.ec__amount {
  font-size: 1.2rem;
  font-weight: 600;
}
.ec__fee {
  display: block;
  font-size: 0.78rem;
  opacity: 0.6;
}
.ec__meta {
  margin: 0;
  font-size: 0.83rem;
  opacity: 0.65;
}
.ec__link {
  color: rgb(var(--fui-theme-primary));
  text-decoration: none;
}
.ec__actions {
  margin-top: 4px;
}
</style>
