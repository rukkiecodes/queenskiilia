<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useMe } from '~/composables/use-me'

const auth = useAuthStore()
const { me } = useMe()
const { isDark, toggle: toggleTheme } = useAppTheme()

const initial = computed(() =>
  (me.value?.fullName ?? me.value?.email ?? 'U').charAt(0).toUpperCase(),
)

async function onLogout() {
  await auth.logout()
  await navigateTo('/login')
}
</script>

<template>
  <f-menu location="bottom-end">
    <template #activator="{ props }">
      <f-avatar
        v-bind="props"
        :image="me?.avatarUrl ?? undefined"
        :text="initial"
        :size="36"
        circle
        pointer
      />
    </template>

    <div class="user-menu">
      <p v-if="me?.email" class="user-menu__email">{{ me.email }}</p>
      <button type="button" class="user-menu__item" @click="navigateTo('/profile')">
        <f-icon icon="user" /> Profile
      </button>
      <button type="button" class="user-menu__item" @click="navigateTo('/settings')">
        <f-icon icon="settings" /> Settings
      </button>
      <button type="button" class="user-menu__item" @click="toggleTheme">
        <f-icon :icon="isDark ? 'sun' : 'moon'" /> {{ isDark ? 'Light mode' : 'Dark mode' }}
      </button>
      <div class="user-menu__sep" />
      <button type="button" class="user-menu__item user-menu__item--danger" @click="onLogout">
        <f-icon icon="log-out" /> Sign out
      </button>
    </div>
  </f-menu>
</template>

<style scoped>
/* FMenu now provides the floating surface (card + shadow); this is just the
   item group inside it. */
.user-menu {
  min-width: 188px;
}
.user-menu__email {
  margin: 0;
  padding: 8px 10px;
  font-size: 0.8rem;
  opacity: 0.6;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-menu__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  border-radius: var(--fui-radius-sm);
  cursor: pointer;
}
.user-menu__item:hover {
  background: rgba(var(--fui-theme-on-background), 0.06);
}
.user-menu__item--danger {
  color: rgb(var(--fui-theme-danger));
}
.user-menu__sep {
  height: 1px;
  margin: 6px 4px;
  background: rgba(var(--fui-theme-on-background), 0.1);
}
</style>
