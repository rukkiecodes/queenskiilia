<script setup lang="ts">
import { fetchAdminDisputes, resolveDispute, type AdminDispute } from '~/lib/admin-queries'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Admin — Disputes' })

const status = ref('all')
const filters = ['all', 'open', 'under_review', 'resolved']

const { data: items, pending, refresh } = await useAsyncData(
  'admin-disputes',
  () => fetchAdminDisputes(status.value === 'all' ? undefined : status.value),
  { watch: [status] },
)

const RESOLUTIONS = [
  { value: 'release_to_student', label: 'Release to talent', hint: 'Pay the escrow to the talent' },
  { value: 'refund_to_business', label: 'Refund to business', hint: 'Return the escrow to the client' },
  { value: 'split', label: 'Split', hint: 'Divide the escrow between both' },
]

const dialogOpen = ref(false)
const active = ref<AdminDispute | null>(null)
const resolution = ref('')
const note = ref('')
const busy = ref(false)
const error = ref('')

function openResolve(d: AdminDispute) {
  active.value = d
  resolution.value = ''
  note.value = ''
  error.value = ''
  dialogOpen.value = true
}

async function confirmResolve() {
  if (!active.value || !resolution.value) return
  busy.value = true
  error.value = ''
  try {
    await resolveDispute(active.value.id, resolution.value, note.value || undefined)
    dialogOpen.value = false
    await refresh()
  } catch (e: any) {
    error.value = e?.message || 'Resolve failed'
  } finally {
    busy.value = false
  }
}

const short = (id: string) => id.slice(0, 8)
const nice = (s: string) => s.replace(/_/g, ' ')
</script>

<template>
  <div>
    <h1 class="ad__title">Disputes</h1>
    <p class="ad__sub">Resolve open project disputes — the outcome moves the escrow.</p>

    <div class="ad__filters">
      <button v-for="f in filters" :key="f" class="ad__chip" :class="{ 'ad__chip--on': status === f }" @click="status = f">
        {{ nice(f) }}
      </button>
    </div>

    <p v-if="pending && !items" class="ad__empty">Loading…</p>
    <p v-else-if="!items?.length" class="ad__empty">No disputes here.</p>

    <div v-else class="ad__list">
      <div v-for="d in items" :key="d.id" class="ad__row">
        <div class="ad__who">
          <strong>{{ d.projectTitle || ('Project ' + short(d.projectId)) }}</strong>
          <span class="ad__meta">{{ d.businessName || '—' }} (client) vs {{ d.studentName || '—' }} (talent)</span>
          <span class="ad__meta">Raised by {{ d.raiserName || short(d.raisedBy) }} · {{ fmtDate(d.createdAt) }}</span>
        </div>
        <div class="ad__body">{{ d.reason }}</div>
        <div class="ad__mid">
          <span class="ad__status" :class="`ad__status--${d.status}`">{{ nice(d.status) }}</span>
          <span v-if="d.resolution" class="ad__meta">→ {{ nice(d.resolution) }}</span>
        </div>
        <div class="ad__actions">
          <f-btn
            v-if="d.status !== 'resolved'"
            size="small"
            color="primary"
            @click="openResolve(d)"
          >
            Resolve
          </f-btn>
          <span v-else class="ad__done">Resolved {{ fmtDate(d.resolvedAt) }}</span>
        </div>
      </div>
    </div>

    <f-dialog v-model="dialogOpen" blur :width="460">
      <template #header><h3 style="margin: 0">Resolve dispute</h3></template>
      <p class="ad__meta" style="margin: 0 0 14px">Choose how the escrow should be settled.</p>
      <div class="ad__resolutions">
        <button
          v-for="r in RESOLUTIONS"
          :key="r.value"
          class="ad__resopt"
          :class="{ 'ad__resopt--on': resolution === r.value }"
          @click="resolution = r.value"
        >
          <strong>{{ r.label }}</strong>
          <span class="ad__meta">{{ r.hint }}</span>
        </button>
      </div>
      <f-textarea v-model="note" label="Admin note (optional)" :rows="2" style="margin-top: 14px" />
      <p v-if="error" class="ad__error" style="margin-top: 12px">{{ error }}</p>
      <template #footer>
        <f-btn variant="text" @click="dialogOpen = false">Cancel</f-btn>
        <f-btn color="primary" :disabled="!resolution" :loading="busy" @click="confirmResolve">Resolve</f-btn>
      </template>
    </f-dialog>
  </div>
</template>

<style scoped>
.ad__resolutions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ad__resopt {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1.5px solid rgba(var(--fui-theme-on-surface), 0.12);
  background: transparent;
  cursor: pointer;
  color: inherit;
}
.ad__resopt--on {
  border-color: rgb(var(--fui-theme-primary));
  background: rgba(var(--fui-theme-primary), 0.08);
}
</style>
