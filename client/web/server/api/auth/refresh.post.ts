/**
 * BFF proxy: rotate the session.
 *
 * Reads the HttpOnly refresh cookie, sends it to the gateway (which rotates +
 * revokes the old one), rewrites both cookies, and returns the fresh access token
 * so the client can update its in-memory token. On failure the session is cleared.
 */
interface RefreshResponse {
  accessToken: string
  refreshToken: string
}

export default defineEventHandler(async (event) => {
  const refreshToken = getRefreshCookie(event)
  if (!refreshToken) {
    setResponseStatus(event, 401)
    return { accessToken: null }
  }

  const config = useRuntimeConfig(event)
  const res = await $fetch.raw<RefreshResponse>(`${config.public.apiUrl}/auth/refresh`, {
    method: 'POST',
    body: { refreshToken },
    ignoreResponseError: true,
  })

  if (res.status >= 200 && res.status < 300 && res._data?.accessToken) {
    setAuthCookies(event, res._data.accessToken, res._data.refreshToken)
    return { accessToken: res._data.accessToken }
  }

  clearAuthCookies(event)
  setResponseStatus(event, 401)
  return { accessToken: null }
})
