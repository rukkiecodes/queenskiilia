<script setup lang="ts">
import { useDeleteAccount } from '~/composables/use-delete-account'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'app' })

const auth = useAuthStore()
const confirmText = ref('')
const error = ref('')
const { mutate, isPending } = useDeleteAccount()

const canDelete = computed(() => confirmText.value.trim() === 'DELETE')

function doDelete() {
  if (!canDelete.value) return
  error.value = ''
  mutate('DELETE', {
    onSuccess: async () => {
      await auth.logout()
      await navigateTo('/login')
    },
    onError: (e: unknown) => {
      error.value = (e as Error)?.message ?? 'Could not delete your account.'
    },
  })
}
</script>

<template>
  <div class="del">
    <button type="button" class="del__back" @click="navigateTo('/settings')">
      <f-icon icon="arrow-left" /> Settings
    </button>
    <h1 class="del__title">Delete account</h1>

    <f-alert type="warning" variant="flat">
      Your account will be deactivated immediately and permanently deleted after a
      <strong>30-day grace period</strong>. Sign in again within 30 days to cancel the deletion.
    </f-alert>

    <p class="del__hint">Type <code>DELETE</code> to confirm.</p>
    <f-input v-model="confirmText" placeholder="DELETE" />

    <f-alert v-if="error" type="error" variant="flat">{{ error }}</f-alert>

    <f-btn color="danger" block size="large" :disabled="!canDelete" :loading="isPending" @click="doDelete">
      Permanently delete my account
    </f-btn>
    <f-btn variant="text" block @click="navigateTo('/settings')">Cancel</f-btn>
  </div>
</template>

<style scoped>
.del {
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.del__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: rgb(var(--fui-theme-primary));
  cursor: pointer;
  font: inherit;
  padding: 0;
  align-self: flex-start;
}
.del__title {
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.del__hint {
  margin: 0;
  opacity: 0.8;
}
.del__hint code {
  background: rgba(var(--fui-theme-on-background), 0.1);
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
}
</style>
