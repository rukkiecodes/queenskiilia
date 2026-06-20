import { useQuery } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { profileApi } from '~/lib/profile-api'

/** A public user profile by id (used for applicant rows, talent profiles). */
export function useUser(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['user', computed(() => toValue(id))],
    queryFn: () => profileApi.getUserById(toValue(id)),
  })
}
