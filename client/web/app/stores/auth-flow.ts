import { defineStore } from 'pinia'
import type { AccountType } from '~/types/auth'

/**
 * Transient signup state carried across the onboarding steps (account type →
 * email → OTP). Cleared once a session is established. Mirrors
 * client/mobile/store/auth-flow-store.ts.
 */
export const useAuthFlowStore = defineStore('auth-flow', () => {
  const accountType = ref<AccountType | null>(null)
  const email = ref<string | null>(null)

  function setAccountType(t: AccountType) {
    accountType.value = t
  }
  function setEmail(e: string) {
    email.value = e
  }
  function reset() {
    accountType.value = null
    email.value = null
  }

  return { accountType, email, setAccountType, setEmail, reset }
})
