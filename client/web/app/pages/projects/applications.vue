<script setup lang="ts">
import { format } from 'date-fns'
import { useMyApplications } from '~/composables/use-my-applications'
import { useWithdrawApplication } from '~/composables/use-project-mutations'
import type { ApplicationStatus } from '~/types/project'

definePageMeta({ layout: 'app', middleware: 'role', requiresRole: 'student' })

const { data: apps, isPending, suspense } = useMyApplications()
onServerPrefetch(() => suspense().catch(() => {}))

const { mutate: withdraw, isPending: withdrawing } = useWithdrawApplication()

const statusColor: Record<ApplicationStatus, string | undefined> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'danger',
  withdrawn: undefined,
}

function fmt(date: string) {
  const d = new Date(date)
  return Number.isNaN(d.getTime()) ? date : format(d, 'PP')
}
</script>

<template>
  <div class="apps">
    <header class="apps__head">
      <h1 class="apps__title">My applications</h1>
      <f-btn variant="text" prepend-icon="arrow-left" @click="navigateTo('/projects')">Marketplace</f-btn>
    </header>

    <p v-if="isPending" class="apps__status">Loading…</p>

    <template v-else-if="apps && apps.length">
      <ul class="apps__list">
        <li v-for="a in apps" :key="a.id" class="apps__item">
          <div class="apps__item-main" @click="navigateTo(`/projects/${a.projectId}`)">
            <div class="apps__item-top">
              <span class="apps__item-id">Project {{ a.projectId.slice(0, 8) }}…</span>
              <f-chip :color="statusColor[a.status]">{{ statusLabel(a.status) }}</f-chip>
            </div>
            <p v-if="a.coverNote" class="apps__note">{{ a.coverNote }}</p>
            <p class="apps__date">Applied {{ fmt(a.appliedAt) }}</p>
          </div>
          <f-btn
            v-if="a.status === 'pending'"
            variant="outlined"
            color="danger"
            size="small"
            :loading="withdrawing"
            @click="withdraw(a.id)"
          >
            Withdraw
          </f-btn>
        </li>
      </ul>
    </template>

    <EmptyState
      v-else
      icon="file-text"
      title="No applications yet"
      text="Browse the marketplace and apply to projects that fit your skills."
    >
      <f-btn color="primary" @click="navigateTo('/projects')">Browse projects</f-btn>
    </EmptyState>
  </div>
</template>

<style scoped>
.apps {
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.apps__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.apps__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.apps__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.apps__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  border-radius: var(--fui-radius-lg);
  background: rgb(var(--fui-theme-surface));
}
.apps__item-main {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}
.apps__item-top {
  display: flex;
  align-items: center;
  gap: 10px;
}
.apps__item-id {
  font-weight: 600;
}
.apps__note {
  margin: 6px 0 0;
  opacity: 0.7;
  font-size: 0.9rem;
}
.apps__date {
  margin: 4px 0 0;
  opacity: 0.55;
  font-size: 0.8rem;
}
.apps__status {
  opacity: 0.6;
}
</style>
