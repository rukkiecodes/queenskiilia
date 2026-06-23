/**
 * BFF proxy: verify an OTP and establish the session.
 *
 * On success the gateway returns { accessToken, refreshToken, user }. We store both
 * tokens in HttpOnly cookies and return ONLY the user to the browser — the raw
 * refresh token never reaches client JS.
 *
 * Body: { email, otp }
 */
interface VerifyOtpResponse {
  accessToken: string
  refreshToken: string
  user: { id: string; email: string; accountType: 'student' | 'business'; isVerified: boolean }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig(event)

  const res = await $fetch.raw<VerifyOtpResponse>(`${config.public.apiUrl}/auth/verify-otp`, {
    method: 'POST',
    body,
    ignoreResponseError: true,
  })

  if (res.status >= 200 && res.status < 300 && res._data?.accessToken) {
    setAuthCookies(event, res._data.accessToken, res._data.refreshToken)
    return { user: res._data.user }
  }

  setResponseStatus(event, res.status || 401)
  return res._data
})
