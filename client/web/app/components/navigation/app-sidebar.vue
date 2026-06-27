<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

defineProps<{ permanent?: boolean; open?: boolean }>()
const emit = defineEmits<{ navigate: []; 'update:open': [boolean] }>()

const auth = useAuthStore()
const route = useRoute()

const studentNav = [
  { id: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: 'home' },
  { id: 'projects', label: 'Projects', to: '/projects', icon: 'briefcase' },
  { id: 'skill-tests', label: 'Skill tests', to: '/skill-tests', icon: 'award', soon: true },
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
  <f-sidebar
    square
    :permanent="permanent"
    :open="open"
    :model-value="activeId"
    :width="240"
    @update:open="emit('update:open', $event)"
  >
    <f-sidebar-item
      v-for="item in nav"
      :id="item.id"
      :key="item.id"
      :active="activeId === item.id"
      :class="{ 'app-sidebar__item--soon': item.soon }"
      @click="go(item.to)"
    >
      <f-icon :icon="item.icon" />
      <span class="app-sidebar__label">{{ item.label }}</span>
      <span v-if="item.soon" class="app-sidebar__soon">Soon</span>
    </f-sidebar-item>
  </f-sidebar>
</template>

<style scoped>
.app-sidebar__label {
  margin-left: 10px;
}
.app-sidebar__item--soon {
  opacity: 0.55;
}
.app-sidebar__soon {
  margin-left: auto;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(var(--fui-theme-on-background), 0.12);
}
</style>
