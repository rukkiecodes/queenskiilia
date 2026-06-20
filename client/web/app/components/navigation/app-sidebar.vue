<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const emit = defineEmits<{ navigate: [] }>()

const auth = useAuthStore()
const route = useRoute()

const studentNav = [
  { id: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: 'home' },
  { id: 'projects', label: 'Projects', to: '/projects', icon: 'briefcase' },
  { id: 'skill-tests', label: 'Skill tests', to: '/skill-tests', icon: 'award' },
  { id: 'portfolio', label: 'Portfolio', to: '/portfolio', icon: 'image' },
  { id: 'chat', label: 'Chat', to: '/chat', icon: 'message-circle' },
]
const businessNav = [
  { id: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: 'home' },
  { id: 'projects', label: 'Projects', to: '/projects', icon: 'briefcase' },
  { id: 'talent', label: 'Talent', to: '/talent', icon: 'users' },
  { id: 'payments', label: 'Payments', to: '/payments', icon: 'credit-card' },
  { id: 'chat', label: 'Chat', to: '/chat', icon: 'message-circle' },
]

const nav = computed(() => (auth.isBusiness ? businessNav : studentNav))
const activeId = computed(
  () => nav.value.find((n) => route.path === n.to || route.path.startsWith(`${n.to}/`))?.id,
)

function go(to: string) {
  emit('navigate')
  navigateTo(to)
}
</script>

<template>
  <f-sidebar permanent :model-value="activeId" :width="240">
    <f-sidebar-item
      v-for="item in nav"
      :id="item.id"
      :key="item.id"
      :active="activeId === item.id"
      @click="go(item.to)"
    >
      <f-icon :icon="item.icon" />
      <span class="app-sidebar__label">{{ item.label }}</span>
    </f-sidebar-item>
  </f-sidebar>
</template>

<style scoped>
.app-sidebar__label {
  margin-left: 10px;
}
</style>
