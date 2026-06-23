import { useQuery } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { projectsApi } from '~/lib/projects-api'

/** Single project by id (reactive — refetches when the id changes; SSR-prefetchable). */
export function useProject(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['project', computed(() => toValue(id))],
    queryFn: () => projectsApi.get(toValue(id)),
  })
}
