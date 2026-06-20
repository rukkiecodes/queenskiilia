import { defineStore, skipHydrate } from 'pinia'
import { setAccessTokenMemory } from '~/lib/access-token'
import { userFromToken } from '~/lib/jwt'
import { profileApi } from '~/lib/profile-api'
import { profileComplete as isProfileComplete } from '~/lib/profile-status'
import type { AuthUser } from '~/types/auth'
import type { Me } from '~/types/profile'

/**
 * Session state. The web app keeps the refresh token in an HttpOnly cookie (never
 * here) and the access token in memory only:
 *  - `accessToken` is `skipHydrate`d, so it is NEVER serialized into the SSR HTML
 *    payload. SSR GraphQL auth reads the cookie directly (see gqlFetch); the client
 *    loads its token via `hydrateFromServer()`.
 *  - `isAuthenticated` derives from `user`, which IS serialized — so the authed
 *    state is consistent across SSR → client without leaking a token.
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const accessToken = skipHydrate(ref<string | null>(null))
  const ready = ref(false)
  // Full profile (non-sensitive → serialized into the SSR payload, hydrates on the client).
  const me = ref<Me | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const accountType = computed(() => user.value?.accountType ?? null)
  const isStudent = computed(() => accountType.value === 'student')
  const isBusiness = computed(() => accountType.value === 'business')
  const profileComplete = computed(() => isProfileComplete(me.value))

  function applyToken(token: string | null) {
    accessToken.value = token
    // Memory mirror is a client-only concept; on the server the module var is
    // shared across requests, so never write it there (gqlFetch reads the cookie).
    if (import.meta.client) setAccessTokenMemory(token)
  }

  /** Called after a successful login (verify-otp). */
  function setSession(nextUser: AuthUser, token: string) {
    user.value = nextUser
    applyToken(token)
  }

  function setUser(nextUser: AuthUser | null) {
    user.value = nextUser
  }

  /**
   * Load the current access token from the cookie-backed BFF into memory/state and
   * derive `user` from its claims. The edge refresh middleware ensures the cookie is
   * already fresh on SSR navigations, so no refresh is needed here.
   */
  async function hydrateFromServer() {
    try {
      const { accessToken: token } = await $fetch<{ accessToken: string | null }>(
        '/api/auth/me-token',
        { headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined },
      )
      applyToken(token ?? null)
      user.value = token ? userFromToken(token) : null
    } catch {
      applyToken(null)
      user.value = null
    } finally {
      ready.value = true
    }
  }

  /** Rotate the session via the BFF; returns the fresh access token or null. */
  async function refresh(): Promise<string | null> {
    try {
      const { accessToken: token } = await $fetch<{ accessToken: string | null }>(
        '/api/auth/refresh',
        { method: 'POST', headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined },
      )
      applyToken(token ?? null)
      return token ?? null
    } catch {
      applyToken(null)
      return null
    }
  }

  /** Fetch the full profile (`me`) into the store. Tolerant of a cold gateway. */
  async function fetchMe(): Promise<Me | null> {
    try {
      me.value = await profileApi.getMe()
    } catch {
      // Keep whatever we had; the gate fails open when `me` is unknown.
    }
    return me.value
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST',
        headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
      })
    } catch {
      // Clear local state regardless of the network result.
    }
    user.value = null
    me.value = null
    applyToken(null)
  }

  return {
    // state
    user,
    accessToken,
    ready,
    me,
    // getters
    isAuthenticated,
    accountType,
    isStudent,
    isBusiness,
    profileComplete,
    // actions
    setSession,
    setUser,
    hydrateFromServer,
    fetchMe,
    refresh,
    logout,
  }
})
