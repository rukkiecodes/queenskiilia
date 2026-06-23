import { useQuery } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { projectsApi } from '~/lib/projects-api'

export function useProjectApplications(projectId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['projectApplications', computed(() => toValue(projectId))],
    queryFn: () => projectsApi.applicationsFor(toValue(projectId)),
  })
}
