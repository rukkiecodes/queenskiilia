/**
 * BFF proxy: revoke the refresh token server-side and clear local cookies.
 * Best-effort — cookies are cleared even if the gateway call fails.
 */
export default defineEventHandler(async (event) => {
  const refreshToken = getRefreshCookie(event)
  const config = useRuntimeConfig(event)

  if (refreshToken) {
    try {
      await $fetch(`${config.public.apiUrl}/auth/logout`, {
        method: 'POST',
        body: { refreshToken },
      })
    } catch {
      // Already invalid / unreachable — clearing the cookies below is what matters.
    }
  }

  clearAuthCookies(event)
  return { message: 'Logged out' }
})
