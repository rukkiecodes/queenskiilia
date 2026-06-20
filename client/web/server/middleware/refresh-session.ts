/**
 * Edge session refresh: on a top-level navigation whose access token is
 * missing/expired but whose refresh token is valid, rotate at the gateway and set
 * fresh cookies on BOTH the response (for the browser) and the incoming request
 * (so this SSR render uses the new token — no login flash). Runs before the Nuxt
 * handler; skips /api, internal, and asset requests.
 */
export default defineEventHandler(async (event) => {
  const path = event.path || ''
  if (path.startsWith('/api/') || path.startsWith('/_') || path.includes('.')) return

  const access = getCookie(event, AUTH_COOKIE.ACCESS)
  const refresh = getCookie(event, AUTH_COOKIE.REFRESH)
  if (!refresh) return
  if (access && !isAccessExpired(access)) return

  const config = useRuntimeConfig(event)
  try {
    const res = await $fetch.raw<{ accessToken?: string; refreshToken?: string }>(
      `${config.public.apiUrl}/auth/refresh`,
      { method: 'POST', body: { refreshToken: refresh }, ignoreResponseError: true },
    )
    const data = res._data
    if (res.status >= 200 && res.status < 300 && data?.accessToken && data?.refreshToken) {
      setAuthCookies(event, data.accessToken, data.refreshToken)
      setRequestCookie(event, AUTH_COOKIE.ACCESS, data.accessToken)
      setRequestCookie(event, AUTH_COOKIE.REFRESH, data.refreshToken)
    } else {
      clearAuthCookies(event)
      setRequestCookie(event, AUTH_COOKIE.ACCESS, '')
      setRequestCookie(event, AUTH_COOKIE.REFRESH, '')
    }
  } catch {
    // Network hiccup — leave cookies as-is; the client refresh path is the backstop.
  }
})
