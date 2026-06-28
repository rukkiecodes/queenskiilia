<script setup lang="ts">
import { adminLogout, useAdminInfo } from '~/lib/admin-api'
import '~/assets/css/admin-queue.css'

const admin = useAdminInfo()

const links = [
  { to: '/admin', label: 'Overview', icon: 'grid' },
  { to: '/admin/verifications', label: 'Verifications', icon: 'shield' },
  { to: '/admin/disputes', label: 'Disputes', icon: 'alert-triangle' },
  { to: '/admin/reports', label: 'Reports', icon: 'flag' },
  { to: '/admin/users', label: 'Users', icon: 'users' },
  { to: '/admin/exams', label: 'Exams', icon: 'award' },
]

function onLogout() {
  adminLogout()
  navigateTo('/admin/login')
}
</script>

<template>
  <div class="admin fui-application">
    <aside class="admin__side">
      <NuxtLink to="/admin" class="admin__brand">
        <img src="/logo.png" alt="" class="admin__logo" />
        <span>Admin</span>
      </NuxtLink>

      <nav class="admin__nav">
        <NuxtLink v-for="l in links" :key="l.to" :to="l.to" class="admin__link" exact-active-class="admin__link--active">
          <f-icon :icon="l.icon" />
          <span>{{ l.label }}</span>
        </NuxtLink>
      </nav>

      <div class="admin__foot">
        <div class="admin__who">
          <strong>{{ admin?.name || 'Admin' }}</strong>
          <span>{{ admin?.email }}</span>
        </div>
        <f-btn size="small" variant="text" color="primary" @click="onLogout">Log out</f-btn>
      </div>
    </aside>

    <main class="admin__main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.admin {
  display: grid;
  grid-template-columns: 248px 1fr;
  min-height: 100dvh;
  background: rgb(var(--fui-theme-background));
}
.admin__side {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 12px;
  background: rgb(var(--fui-theme-surface));
  border-right: 1px solid rgba(var(--fui-theme-on-surface), 0.08);
  position: sticky;
  top: 0;
  height: 100dvh;
}
.admin__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 14px;
  font-weight: 700;
  color: inherit;
  text-decoration: none;
}
.admin__logo {
  height: 28px;
  width: auto;
}
.admin__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.admin__link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  color: rgba(var(--fui-theme-on-surface), 0.75);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.92rem;
}
.admin__link:hover {
  background: rgba(var(--fui-theme-on-surface), 0.05);
}
.admin__link--active {
  background: rgba(var(--fui-theme-primary), 0.12);
  color: rgb(var(--fui-theme-primary));
}
.admin__foot {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 10px 4px;
  border-top: 1px solid rgba(var(--fui-theme-on-surface), 0.08);
}
.admin__who {
  display: flex;
  flex-direction: column;
  font-size: 0.82rem;
}
.admin__who span {
  opacity: 0.6;
}
.admin__main {
  padding: 28px clamp(16px, 4vw, 48px);
  min-width: 0;
}
@media (max-width: 720px) {
  .admin {
    grid-template-columns: 1fr;
  }
  .admin__side {
    position: static;
    height: auto;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }
  .admin__nav {
    flex-direction: row;
    flex-wrap: wrap;
    flex: 1;
  }
  .admin__foot {
    margin: 0;
    border: 0;
    flex-direction: row;
    align-items: center;
  }
}
</style>
