<script setup lang="ts">
import type { PublicUser } from '~/types/profile'

const props = defineProps<{ user: PublicUser }>()
const initial = computed(() => (props.user.fullName ?? 'T').charAt(0).toUpperCase())
const sp = computed(() => props.user.studentProfile)
</script>

<template>
  <NuxtLink :to="`/talent/${user.id}`" class="uc">
    <f-avatar :image="user.avatarUrl ?? undefined" :text="initial" :size="56" circle />
    <div class="uc__body">
      <h3 class="uc__name">
        {{ user.fullName ?? 'Talent' }}
        <f-chip v-if="user.isVerified" color="success">Verified</f-chip>
      </h3>
      <p v-if="sp" class="uc__meta">
        <span v-if="sp.skillLevel">{{ sp.skillLevel }}</span>
        <span v-if="sp.averageRating != null"> · ★ {{ sp.averageRating.toFixed(1) }}</span>
        <span v-if="user.country"> · {{ user.country }}</span>
      </p>
      <div v-if="sp?.skills?.length" class="uc__skills">
        <f-chip v-for="s in sp.skills.slice(0, 3)" :key="s">{{ s }}</f-chip>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.uc {
  display: flex;
  gap: 14px;
  padding: 16px;
  border-radius: var(--fui-radius-lg);
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  background: rgb(var(--fui-theme-surface));
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.uc:hover {
  border-color: rgba(var(--fui-theme-primary), 0.5);
  transform: translateY(-2px);
}
.uc__body {
  min-width: 0;
}
.uc__name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}
.uc__meta {
  margin: 4px 0 0;
  opacity: 0.7;
  font-size: 0.85rem;
}
.uc__skills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}
</style>
