import { useQuery } from '@tanstack/vue-query'
import { projectsApi } from '~/lib/projects-api'

export function useMyApplications() {
  return useQuery({
    queryKey: ['myApplications'],
    queryFn: () => projectsApi.myApplications(),
  })
}
