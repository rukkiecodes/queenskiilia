import { useAuthStore } from '~/stores/auth'

/**
 * Bootstraps the session before route middleware runs. Universal + awaited so the
 * access token (from the HttpOnly cookie on the server, from /api/auth/me-token on
 * the client) is in the store before `auth.global` makes a routing decision.
 */
export default defineNuxtPlugin(async () => {
  const auth = useAuthStore()
  if (!auth.ready) {
    await auth.hydrateFromServer()
  }
  // Load the full profile for the gate/navbar. On the client this is already
  // hydrated from the SSR payload, so only fetch when missing.
  if (auth.accessToken && !auth.me) {
    await auth.fetchMe()
  }
})
