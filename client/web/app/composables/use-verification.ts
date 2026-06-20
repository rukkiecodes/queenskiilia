import { useMutation } from '@tanstack/vue-query'
import { profileApi } from '~/lib/profile-api'
import { useAuthStore } from '~/stores/auth'
import type { SubmitVerificationInput } from '~/types/profile'

/** Submit an identity verification (type 'id' | 'face' …); refreshes `me`. */
export function useSubmitVerification() {
  const auth = useAuthStore()
  return useMutation({
    mutationFn: (input: SubmitVerificationInput) => profileApi.submitVerification(input),
    onSuccess: () => auth.fetchMe(),
  })
}
