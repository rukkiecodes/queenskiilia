import { useAuthStore } from '~/stores/auth'

/**
 * Named middleware for role-gated pages. Apply via:
 *   definePageMeta({ middleware: 'role', requiresRole: 'student' })
 *
 * Active once `user.accountType` is populated by the `me` query (Feature 02). Until
 * then accountType is null and the guard is a no-op (the global auth gate still runs).
 */
export default defineNuxtRouteMiddleware((to) => {
  const required = to.meta.requiresRole as 'student' | 'business' | undefined
  if (!required) return

  const auth = useAuthStore()
  if (auth.accountType && auth.accountType !== required) {
    return navigateTo('/dashboard')
  }
})
