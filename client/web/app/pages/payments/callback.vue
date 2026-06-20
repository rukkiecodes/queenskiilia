<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { useVerifyPayment } from '~/composables/use-paystack'

definePageMeta({ layout: 'app', middleware: 'role', requiresRole: 'business' })

const route = useRoute()
const reference = computed(
  () => (route.query.reference ?? route.query.trxref) as string | undefined,
)

const { data: verification, isPending, isError } = useVerifyPayment(() => reference.value)
const qc = useQueryClient()

const success = computed(() => verification.value?.status === 'success')

watch(success, (ok) => {
  if (ok) qc.invalidateQueries({ queryKey: ['myEscrows'] })
})
</script>

<template>
  <div class="cb">
    <ClientOnly>
      <template v-if="isPending">
        <f-progress-circular indeterminate />
        <p>Verifying your payment…</p>
      </template>

      <template v-else-if="success">
        <div class="cb__icon cb__icon--ok"><f-icon icon="check" /></div>
        <h1 class="cb__title">Payment confirmed</h1>
        <p class="cb__sub">Your funds are now held safely in escrow.</p>
        <f-btn color="primary" @click="navigateTo('/payments')">View payments</f-btn>
      </template>

      <template v-else>
        <div class="cb__icon cb__icon--err"><f-icon icon="x" /></div>
        <h1 class="cb__title">Payment not confirmed</h1>
        <p class="cb__sub">
          {{ isError ? 'We could not verify this payment.' : verification?.gatewayResponse || 'The payment was not completed.' }}
        </p>
        <f-btn variant="outlined" color="primary" @click="navigateTo('/payments')">Back to payments</f-btn>
      </template>

      <template #fallback>
        <p>Verifying your payment…</p>
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
.cb {
  max-width: 420px;
  margin: 0 auto;
  padding-top: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
}
.cb__icon {
  width: 72px;
  height: 72px;
  border-radius: 9999px;
  display: grid;
  place-items: center;
  font-size: 30px;
}
.cb__icon--ok {
  background: rgba(var(--fui-theme-success), 0.15);
  color: rgb(var(--fui-theme-success));
}
.cb__icon--err {
  background: rgba(var(--fui-theme-danger), 0.15);
  color: rgb(var(--fui-theme-danger));
}
.cb__title {
  margin: 4px 0 0;
  font-weight: 600;
}
.cb__sub {
  margin: 0;
  opacity: 0.7;
}
</style>
