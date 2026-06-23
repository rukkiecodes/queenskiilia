import { useQuery } from '@tanstack/vue-query'
import { projectsApi } from '~/lib/projects-api'

export function useMyProjects() {
  return useQuery({
    queryKey: ['myProjects'],
    queryFn: () => projectsApi.myProjects(),
  })
}
