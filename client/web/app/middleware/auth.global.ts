import { useAuthStore } from '~/stores/auth'

/**
 * Global auth + profile gate.
 *  - No session on a protected route → /login (preserving a redirect).
 *  - Authenticated on a pre-auth screen (login/verify/onboarding) → role home,
 *    EXCEPT the profile-setup screen which an authed-but-incomplete user needs.
 *  - Authenticated but profile incomplete → /onboarding/profile (only when `me`
 *    is actually loaded — fail open on a cold gateway so we never loop).
 *
 * "Session" = an authenticated user. `user` is derived from the token claims and
 * IS serialized SSR→client, so it stays reliable on client-side (SPA) navigation —
 * unlike the raw access token, which is skipHydrate'd (used by gqlFetch, not here).
 */

const ROLE_HOME = '/dashboard'
const PROFILE_SETUP = '/onboarding/profile'

const PUBLIC_EXACT = new Set<string>(['/'])
const PUBLIC_PREFIXES = ['/login', '/verify', '/onboarding', '/legal', '/certificates']
// Pre-auth screens an authenticated user should be bounced off of.
const PRE_AUTH_PREFIXES = ['/login', '/verify', '/onboarding']
const DEV_PUBLIC = new Set<string>(['/smoke-data', '/smoke-stores'])

function matchesPrefix(path: string, prefixes: string[]): boolean {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`))
}

function isPublic(path: string): boolean {
  if (PUBLIC_EXACT.has(path)) return true
  if (import.meta.dev && DEV_PUBLIC.has(path)) return true
  // Public student profiles `/talent/:id` (but NOT the `/talent` business directory).
  if (path.startsWith('/talent/')) return true
  return matchesPrefix(path, PUBLIC_PREFIXES)
}

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  const hasSession = auth.isAuthenticated
  const path = to.path

  // The /admin section is a separate identity with its own guard
  // (middleware/admin.ts) — never subject the user-auth gate to it.
  if (path === '/admin' || path.startsWith('/admin/')) return

  if (!hasSession) {
    // The profile-setup screen requires a session.
    if (path === PROFILE_SETUP) {
      return navigateTo({ path: '/login', query: { redirect: path } })
    }
    if (isPublic(path)) return
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  // Authenticated: bounce off pre-auth screens (but allow the profile-setup step).
  if (path !== PROFILE_SETUP && matchesPrefix(path, PRE_AUTH_PREFIXES)) {
    return navigateTo(ROLE_HOME)
  }

  // Profile-completeness gate — only act once `me` is known.
  if (path !== PROFILE_SETUP && auth.me && !auth.profileComplete) {
    return navigateTo(PROFILE_SETUP)
  }
})
