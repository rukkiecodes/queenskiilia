<script setup lang="ts">
import { useBanks, useMyPayoutAccount, useResolveAccount, useSetupPayout } from '~/composables/use-payouts'

definePageMeta({ layout: 'app', middleware: 'role', requiresRole: 'student' })

const { data: payout, isPending: loadingPayout, suspense } = useMyPayoutAccount()
onServerPrefetch(() => suspense().catch(() => {}))

const { data: banks } = useBanks()
const bankItems = computed(() =>
  (banks.value ?? []).map((b) => ({ title: b.name, value: b.code })),
)

const editing = ref(false)
const bankCode = ref('')
const accountNumber = ref('')
const error = ref('')

// Restrict the account number to 10 digits (NGN NUBAN).
watch(accountNumber, (v) => {
  const clean = v.replace(/\D/g, '').slice(0, 10)
  if (clean !== v) accountNumber.value = clean
})

const { data: resolved, isFetching: resolving, error: resolveError } = useResolveAccount(
  accountNumber,
  bankCode,
)

const { mutate: save, isPending: saving } = useSetupPayout()

const showForm = computed(() => editing.value || !payout.value?.isComplete)
const canSave = computed(() => !!resolved.value?.accountName && !saving.value)
const currentBankName = computed(
  () => banks.value?.find((b) => b.code === payout.value?.bankCode)?.name ?? payout.value?.bankCode,
)
const maskedAccount = computed(() => {
  const n = payout.value?.accountNumber
  return n ? `••••••${n.slice(-4)}` : ''
})

function startEdit() {
  editing.value = true
  bankCode.value = payout.value?.bankCode ?? ''
  accountNumber.value = ''
  error.value = ''
}
function cancel() {
  editing.value = false
  error.value = ''
}
function submit() {
  if (!canSave.value) return
  error.value = ''
  save(
    { bankCode: bankCode.value, accountNumber: accountNumber.value },
    {
      onSuccess: () => {
        editing.value = false
        bankCode.value = ''
        accountNumber.value = ''
      },
      onError: (e: unknown) => (error.value = (e as Error)?.message ?? 'Could not save payout details.'),
    },
  )
}
</script>

<template>
  <div class="po">
    <button type="button" class="po__back" @click="navigateTo('/settings')">
      <f-icon icon="arrow-left" /> Settings
    </button>
    <h1 class="po__title">Payouts</h1>
    <p class="po__sub">Add the bank account where you'll receive payment for completed work.</p>

    <p v-if="loadingPayout" class="po__status">Loading…</p>

    <template v-else>
      <!-- Current payout summary -->
      <div v-if="payout?.isComplete && !editing" class="po__card po__card--set">
        <div class="po__set-head">
          <f-icon icon="check-circle" class="po__check" />
          <span>Payout account connected</span>
        </div>
        <dl class="po__facts">
          <div><dt>Bank</dt><dd>{{ currentBankName }}</dd></div>
          <div><dt>Account</dt><dd>{{ maskedAccount }}</dd></div>
          <div><dt>Name</dt><dd>{{ payout?.accountName }}</dd></div>
        </dl>
        <f-btn variant="outlined" size="small" @click="startEdit">Update bank details</f-btn>
      </div>

      <!-- Setup / edit form -->
      <div v-if="showForm" class="po__card">
        <f-select
          v-model="bankCode"
          :items="bankItems"
          item-title="title"
          item-value="value"
          label="Bank"
          placeholder="Select your bank"
          filter
          clearable
        />

        <f-input
          v-model="accountNumber"
          label="Account number"
          placeholder="10-digit account number"
          inputmode="numeric"
        />

        <div class="po__resolve" aria-live="polite">
          <span v-if="resolving" class="po__resolving"><f-icon icon="loader" /> Verifying account…</span>
          <span v-else-if="resolved?.accountName" class="po__resolved">
            <f-icon icon="check" /> {{ resolved.accountName }}
          </span>
          <span v-else-if="resolveError && accountNumber.length === 10 && bankCode" class="po__resolve-err">
            Couldn't verify this account — check the number and bank.
          </span>
        </div>

        <f-alert v-if="error" type="error" variant="flat">{{ error }}</f-alert>

        <f-btn color="primary" block size="large" :disabled="!canSave" :loading="saving" @click="submit">
          {{ payout?.isComplete ? 'Update payout account' : 'Save payout account' }}
        </f-btn>
        <f-btn v-if="editing && payout?.isComplete" variant="text" block @click="cancel">Cancel</f-btn>
      </div>

      <f-alert type="info" variant="flat" class="po__note">
        Your share of each project is held securely and paid to this account when the client approves
        your work. A small platform fee is deducted from each payout.
      </f-alert>
    </template>
  </div>
</template>

<style scoped>
.po {
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.po__back {
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
.po__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.po__sub {
  margin: 0;
  opacity: 0.7;
}
.po__card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  border-radius: var(--fui-radius-lg);
  background: rgb(var(--fui-theme-surface));
}
.po__card--set {
  gap: 12px;
}
.po__set-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.po__check {
  color: rgb(var(--fui-theme-success));
}
.po__facts {
  margin: 0;
  display: grid;
  gap: 8px;
}
.po__facts > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.po__facts dt {
  opacity: 0.55;
  font-size: 0.85rem;
}
.po__facts dd {
  margin: 0;
  font-weight: 600;
}
.po__resolve {
  min-height: 20px;
  font-size: 0.9rem;
}
.po__resolving {
  opacity: 0.7;
}
.po__resolved {
  color: rgb(var(--fui-theme-success));
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.po__resolve-err {
  color: rgb(var(--fui-theme-danger));
}
.po__note {
  margin-top: 4px;
}
.po__status {
  opacity: 0.6;
}
</style>
