<script setup lang="ts">
import { fetchAdminVerifications, reviewVerification, type AdminVerification } from '~/lib/admin-queries'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Admin — Verifications' })

const status = ref('pending')
const filters = ['pending', 'approved', 'rejected', 'all']

const { data: items, pending, refresh } = await useAsyncData(
  'admin-verifications',
  () => fetchAdminVerifications(status.value === 'all' ? undefined : status.value),
  { watch: [status] },
)

const error = ref('')
const dialogOpen = ref(false)
const active = ref<AdminVerification | null>(null)
const decision = ref<'approve' | 'reject'>('approve')
const note = ref('')
const busy = ref(false)

function openReview(v: AdminVerification, d: 'approve' | 'reject') {
  active.value = v
  decision.value = d
  note.value = ''
  error.value = ''
  dialogOpen.value = true
}

async function confirmReview() {
  if (!active.value) return
  busy.value = true
  error.value = ''
  try {
    await reviewVerification(active.value.id, decision.value, note.value.trim() || undefined)
    dialogOpen.value = false
    await refresh()
  } catch (e: any) {
    error.value = e?.message || 'Action failed'
  } finally {
    busy.value = false
  }
}

function label(t: string) {
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
</script>

<template>
  <div>
    <h1 class="ad__title">Verifications</h1>
    <p class="ad__sub">Review submitted ID &amp; document verifications.</p>

    <div class="ad__filters">
      <button
        v-for="f in filters"
        :key="f"
        class="ad__chip"
        :class="{ 'ad__chip--on': status === f }"
        @click="status = f"
      >
        {{ label(f) }}
      </button>
    </div>

    <p v-if="pending && !items" class="ad__empty">Loading…</p>
    <p v-else-if="!items?.length" class="ad__empty">Nothing in this queue.</p>

    <div v-else class="ad__list">
      <div v-for="v in items" :key="v.id" class="ad__row">
        <div class="ad__who">
          <strong>{{ v.user?.fullName || v.user?.email || 'Unknown user' }}</strong>
          <span class="ad__meta">{{ v.user?.email }} · {{ v.user?.accountType }}</span>
          <span class="ad__meta">{{ label(v.type) }} · submitted {{ fmtDate(v.submittedAt) }}</span>
        </div>

        <div class="ad__mid">
          <a v-if="v.documentUrl" :href="v.documentUrl" target="_blank" rel="noopener" class="ad__doclink">
            <f-icon icon="external-link" /> View document
          </a>
          <span v-else class="ad__meta">No document</span>
          <span class="ad__status" :class="`ad__status--${v.status}`">{{ v.status }}</span>
        </div>

        <div class="ad__actions">
          <template v-if="v.status === 'pending'">
            <f-btn size="small" color="success" @click="openReview(v, 'approve')">Approve</f-btn>
            <f-btn size="small" color="danger" variant="outlined" @click="openReview(v, 'reject')">Reject</f-btn>
          </template>
          <span v-else class="ad__done">Reviewed {{ fmtDate(v.reviewedAt) }}</span>
        </div>
      </div>
    </div>

    <f-dialog v-model="dialogOpen" blur :width="440">
      <template #header>
        <h3 style="margin: 0">{{ decision === 'approve' ? 'Approve' : 'Reject' }} verification</h3>
      </template>
      <p class="ad__meta" style="margin: 0 0 12px">
        {{ active?.user?.fullName || active?.user?.email }} · {{ active ? label(active.type) : '' }}
      </p>
      <f-textarea
        v-model="note"
        :label="decision === 'reject' ? 'Reason for rejection (recommended)' : 'Note (optional)'"
        :rows="3"
      />
      <p v-if="error" class="ad__error" style="margin-top: 12px">{{ error }}</p>
      <template #footer>
        <f-btn variant="text" @click="dialogOpen = false">Cancel</f-btn>
        <f-btn :color="decision === 'approve' ? 'success' : 'danger'" :loading="busy" @click="confirmReview">
          {{ decision === 'approve' ? 'Approve' : 'Reject' }}
        </f-btn>
      </template>
    </f-dialog>
  </div>
</template>
