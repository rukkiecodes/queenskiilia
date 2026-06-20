<script setup lang="ts">
import FinancialDisclaimer from '~/components/financial-disclaimer.vue'
import { useProject } from '~/composables/use-project'
import { useEscrow, useInitiateEscrow } from '~/composables/use-payments'
import { useInitializePayment } from '~/composables/use-paystack'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'app', middleware: 'role', requiresRole: 'business' })

const route = useRoute()
const id = computed(() => route.params.id as string)
const auth = useAuthStore()

const { data: project, suspense } = useProject(() => id.value)
onServerPrefetch(() => suspense().catch(() => {}))
const { data: existingEscrow } = useEscrow(() => id.value)

const { mutateAsync: initiate } = useInitiateEscrow()
const { mutateAsync: initialize } = useInitializePayment()
const loading = ref(false)
const error = ref('')

const alreadyFunded = computed(
  () => !!existingEscrow.value && existingEscrow.value.status !== 'refunded',
)

async function fund() {
  if (!project.value) return
  if (!project.value.selectedStudent) {
    error.value = 'Select a student before funding the escrow.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const reference = `qs_${project.value.id.replace(/-/g, '').slice(0, 12)}_${Date.now()}`
    await initiate({
      projectId: project.value.id,
      studentId: project.value.selectedStudent,
      amount: project.value.budget,
      currency: project.value.currency,
      gateway: 'paystack',
      gatewayRef: reference,
    })
    const callbackUrl = `${window.location.origin}/payments/callback?reference=${encodeURIComponent(reference)}`
    const init = await initialize({
      email: auth.me?.email ?? auth.user?.email ?? '',
      amountKobo: Math.round(project.value.budget * 100),
      reference,
      callbackUrl,
    })
    window.location.href = init.authorizationUrl
  } catch (e: unknown) {
    error.value = (e as Error)?.message ?? 'Could not start the payment. Please try again.'
    loading.value = false
  }
}
</script>

<template>
  <div v-if="project" class="fund">
    <button type="button" class="fund__back" @click="navigateTo(`/projects/${project.id}`)">
      <f-icon icon="arrow-left" /> Back to project
    </button>

    <h1 class="fund__title">Fund escrow</h1>
    <p class="fund__project">{{ project.title }}</p>

    <div class="fund__amount">
      <span class="fund__value">{{ project.currency }} {{ project.budget.toLocaleString() }}</span>
      <span class="fund__label">will be held in escrow</span>
    </div>

    <FinancialDisclaimer />

    <f-alert v-if="alreadyFunded" type="success" variant="flat">
      This project is already funded ({{ existingEscrow?.status }}).
    </f-alert>
    <f-alert v-if="error" type="error" variant="flat">{{ error }}</f-alert>

    <f-btn
      v-if="!alreadyFunded"
      color="primary"
      size="large"
      block
      prepend-icon="credit-card"
      :loading="loading"
      @click="fund"
    >
      Pay with Paystack
    </f-btn>
    <f-btn v-else color="primary" size="large" block @click="navigateTo('/payments')">
      View payments
    </f-btn>
  </div>

  <p v-else class="fund__loading">Loading…</p>
</template>

<style scoped>
.fund {
  max-width: 520px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.fund__back {
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
.fund__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.fund__project {
  margin: 0;
  opacity: 0.7;
}
.fund__amount {
  text-align: center;
  padding: 20px;
  border-radius: var(--fui-radius-lg);
  background: rgba(var(--fui-theme-primary), 0.06);
}
.fund__value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: rgb(var(--fui-theme-primary));
}
.fund__label {
  opacity: 0.7;
  font-size: 0.9rem;
}
.fund__loading {
  opacity: 0.6;
}
</style>
