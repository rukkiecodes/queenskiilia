<script setup lang="ts">
import { fetchAdminReports, reviewReport, type AdminReport } from '~/lib/admin-queries'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Admin — Reports' })

const status = ref('open')
const filters = ['open', 'actioned', 'dismissed', 'all']

const { data: items, pending, refresh } = await useAsyncData(
  'admin-reports',
  () => fetchAdminReports(status.value === 'all' ? undefined : status.value),
  { watch: [status] },
)

const error = ref('')
const dialogOpen = ref(false)
const active = ref<AdminReport | null>(null)
const action = ref<'actioned' | 'dismissed'>('dismissed')
const note = ref('')
const busy = ref(false)

function openAct(r: AdminReport, a: 'actioned' | 'dismissed') {
  active.value = r
  action.value = a
  note.value = ''
  error.value = ''
  dialogOpen.value = true
}

async function confirmAct() {
  if (!active.value) return
  busy.value = true
  error.value = ''
  try {
    await reviewReport(active.value.id, action.value, note.value.trim() || undefined)
    dialogOpen.value = false
    await refresh()
  } catch (e: any) {
    error.value = e?.message || 'Action failed'
  } finally {
    busy.value = false
  }
}

const short = (id: string) => id.slice(0, 8)
</script>

<template>
  <div>
    <h1 class="ad__title">Reports</h1>
    <p class="ad__sub">Content-moderation reports from users.</p>

    <div class="ad__filters">
      <button v-for="f in filters" :key="f" class="ad__chip" :class="{ 'ad__chip--on': status === f }" @click="status = f">
        {{ f }}
      </button>
    </div>

    <p v-if="pending && !items" class="ad__empty">Loading…</p>
    <p v-else-if="!items?.length" class="ad__empty">No reports here.</p>

    <div v-else class="ad__list">
      <div v-for="r in items" :key="r.id" class="ad__row">
        <div class="ad__who">
          <strong>{{ r.targetLabel || short(r.targetId) }}</strong>
          <span class="ad__meta">{{ r.targetType }} · reported by {{ r.reporterName || short(r.reporterId) }} · {{ fmtDate(r.createdAt) }}</span>
          <span><span class="ad__tag">{{ r.reason }}</span></span>
        </div>
        <div class="ad__body">{{ r.details || '—' }}</div>
        <div class="ad__mid">
          <span class="ad__status" :class="`ad__status--${r.status}`">{{ r.status }}</span>
        </div>
        <div class="ad__actions">
          <template v-if="r.status === 'open'">
            <f-btn size="small" color="danger" @click="openAct(r, 'actioned')">Action</f-btn>
            <f-btn size="small" variant="outlined" @click="openAct(r, 'dismissed')">Dismiss</f-btn>
          </template>
          <span v-else class="ad__done">Reviewed {{ fmtDate(r.reviewedAt) }}</span>
        </div>
      </div>
    </div>

    <f-dialog v-model="dialogOpen" blur :width="440">
      <template #header>
        <h3 style="margin: 0">{{ action === 'actioned' ? 'Action report' : 'Dismiss report' }}</h3>
      </template>
      <p class="ad__meta" style="margin: 0 0 12px">
        {{ active?.targetType }} · {{ active?.targetLabel || (active ? short(active.targetId) : '') }} · {{ active?.reason }}
      </p>
      <f-textarea
        v-model="note"
        :label="action === 'actioned' ? 'What action was taken? (recommended)' : 'Note (optional)'"
        :rows="3"
      />
      <p v-if="error" class="ad__error" style="margin-top: 12px">{{ error }}</p>
      <template #footer>
        <f-btn variant="text" @click="dialogOpen = false">Cancel</f-btn>
        <f-btn :color="action === 'actioned' ? 'danger' : 'primary'" :loading="busy" @click="confirmAct">
          {{ action === 'actioned' ? 'Action' : 'Dismiss' }}
        </f-btn>
      </template>
    </f-dialog>
  </div>
</template>
