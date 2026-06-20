import { useMutation } from '@tanstack/vue-query'
import { requestOtp, verifyOtp } from '~/lib/auth-api'
import { useAuthStore } from '~/stores/auth'

/** Send an OTP to the given email + account type. */
export function useRequestOtp() {
  return useMutation({ mutationFn: requestOtp })
}

/**
 * Verify the OTP. On success the BFF sets the session cookies and returns the user;
 * we then load the access token into memory (and connect the socket) before the
 * caller redirects.
 */
export function useVerifyOtp() {
  const auth = useAuthStore()
  return useMutation({
    mutationFn: verifyOtp,
    onSuccess: async ({ user }) => {
      auth.setUser(user)
      await auth.hydrateFromServer()
      await auth.fetchMe()
    },
  })
}
