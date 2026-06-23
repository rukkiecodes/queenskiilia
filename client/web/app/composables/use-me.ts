import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'

/** The current user's full profile (lives in the auth store; SSR-hydrated). */
export function useMe() {
  const auth = useAuthStore()
  const { me } = storeToRefs(auth)
  return { me, refetch: () => auth.fetchMe() }
}
