<script setup lang="ts">
import { format } from 'date-fns'
import { useUser } from '~/composables/use-user'
import type { Application } from '~/types/project'

const props = defineProps<{ application: Application; selectable: boolean; selecting: boolean }>()
const emit = defineEmits<{ select: [studentId: string] }>()

// Client-fetched (no SSR prefetch) — applicant names fill in after hydration.
const { data: user } = useUser(() => props.application.studentId)

const name = computed(() => user.value?.fullName ?? `Student ${props.application.studentId.slice(0, 8)}`)
const initial = computed(() => (user.value?.fullName ?? 'S').charAt(0).toUpperCase())
const statusColor: Record<string, string | undefined> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'danger',
  withdrawn: undefined,
}
</script>

<template>
  <div class="ar">
    <f-avatar :image="user?.avatarUrl ?? undefined" :text="initial" :size="44" circle />
    <div class="ar__main">
      <div class="ar__top">
        <NuxtLink :to="`/talent/${application.studentId}`" class="ar__name">{{ name }}</NuxtLink>
        <f-chip :color="statusColor[application.status]">{{ application.status }}</f-chip>
      </div>
      <p v-if="user?.studentProfile" class="ar__meta">
        <span v-if="user.studentProfile.skillLevel">{{ user.studentProfile.skillLevel }}</span>
        <span v-if="user.studentProfile.averageRating != null"> · {{ user.studentProfile.averageRating.toFixed(1) }} ★</span>
      </p>
      <p v-if="application.coverNote" class="ar__note">{{ application.coverNote }}</p>
      <p class="ar__date">Applied {{ format(new Date(application.appliedAt), 'PP') }}</p>
    </div>
    <f-btn
      v-if="selectable && application.status === 'pending'"
      color="primary"
      size="small"
      :loading="selecting"
      @click="emit('select', application.studentId)"
    >
      Select
    </f-btn>
    <f-chip v-else-if="application.status === 'accepted'" color="success">Selected</f-chip>
  </div>
</template>

<style scoped>
.ar {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  border-radius: var(--fui-radius-lg);
  background: rgb(var(--fui-theme-surface));
}
.ar__main {
  flex: 1;
  min-width: 0;
}
.ar__top {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ar__name {
  font-weight: 600;
  color: inherit;
  text-decoration: none;
}
.ar__name:hover {
  color: rgb(var(--fui-theme-primary));
}
.ar__meta {
  margin: 4px 0 0;
  font-size: 0.85rem;
  opacity: 0.7;
}
.ar__note {
  margin: 8px 0 0;
  opacity: 0.8;
  font-size: 0.9rem;
}
.ar__date {
  margin: 6px 0 0;
  font-size: 0.78rem;
  opacity: 0.5;
}
</style>
