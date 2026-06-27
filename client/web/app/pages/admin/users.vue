<script setup lang="ts">
import { fetchAdminUsers, setUserActive, setUserVerified, type AdminUserSummary } from '~/lib/admin-queries'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Admin — Users' })

const accountType = ref('')
const typeFilters = [
  { v: '', label: 'All' },
  { v: 'student', label: 'Talent' },
  { v: 'business', label: 'Business' },
]
const searchInput = ref('')
const search = ref('')

const { data: items, pending, refresh } = await useAsyncData(
  'admin-users',
  () => fetchAdminUsers(search.value || undefined, accountType.value || undefined),
  { watch: [search, accountType] },
)

function applySearch() {
  search.value = searchInput.value.trim()
}

const busy = ref<string | null>(null)
const error = ref('')

async function toggleActive(u: AdminUserSummary) {
  busy.value = u.id
  error.value = ''
  try {
    const res = await setUserActive(u.id, !u.isActive)
    u.isActive = res.isActive
  } catch (e: any) {
    error.value = e?.message || 'Action failed'
  } finally {
    busy.value = null
  }
}

async function toggleVerified(u: AdminUserSummary) {
  busy.value = u.id
  error.value = ''
  try {
    const res = await setUserVerified(u.id, !u.isVerified)
    u.isVerified = res.isVerified
  } catch (e: any) {
    error.value = e?.message || 'Action failed'
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <div>
    <h1 class="ad__title">Users</h1>
    <p class="ad__sub">Browse accounts; verify or suspend them.</p>

    <div class="ad__filters">
      <button v-for="t in typeFilters" :key="t.v" class="ad__chip" :class="{ 'ad__chip--on': accountType === t.v }" @click="accountType = t.v">
        {{ t.label }}
      </button>
    </div>

    <form class="ad__search" @submit.prevent="applySearch">
      <f-input v-model="searchInput" label="Search name or email" prepend-icon="search" style="flex: 1" />
      <f-btn color="primary" @click="applySearch">Search</f-btn>
    </form>

    <p v-if="error" class="ad__error">{{ error }}</p>
    <p v-if="pending && !items" class="ad__empty">Loading…</p>
    <p v-else-if="!items?.length" class="ad__empty">No users found.</p>

    <table v-else class="ad__table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Type</th>
          <th>Status</th>
          <th>Joined</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in items" :key="u.id">
          <td>{{ u.fullName || '—' }}</td>
          <td>{{ u.email }}</td>
          <td style="text-transform: capitalize">{{ u.accountType }}</td>
          <td>
            <span class="ad__status" :class="u.isVerified ? 'ad__status--approved' : ''">
              {{ u.isVerified ? 'Verified' : 'Unverified' }}
            </span>
            <span v-if="!u.isActive" class="ad__status ad__status--rejected" style="margin-left: 4px">Suspended</span>
          </td>
          <td>{{ fmtDate(u.createdAt) }}</td>
          <td>
            <div class="ad__actions">
              <f-btn size="small" variant="outlined" :loading="busy === u.id" @click="toggleVerified(u)">
                {{ u.isVerified ? 'Unverify' : 'Verify' }}
              </f-btn>
              <f-btn
                size="small"
                :color="u.isActive ? 'danger' : 'success'"
                variant="outlined"
                :loading="busy === u.id"
                @click="toggleActive(u)"
              >
                {{ u.isActive ? 'Suspend' : 'Restore' }}
              </f-btn>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
