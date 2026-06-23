/**
 * BFF proxy: request an OTP. Transparent pass-through to the gateway — no cookies.
 * Body: { email, accountType: 'student' | 'business' }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig(event)

  const res = await $fetch.raw(`${config.public.apiUrl}/auth/request-otp`, {
    method: 'POST',
    body,
    ignoreResponseError: true,
  })

  setResponseStatus(event, res.status)
  return res._data
})
