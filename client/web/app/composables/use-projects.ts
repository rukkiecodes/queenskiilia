import { useInfiniteQuery } from '@tanstack/vue-query'
import { projectsApi } from '~/lib/projects-api'
import { useProjectFilters } from '~/composables/use-project-filters'
import type { Project } from '~/types/project'

const PAGE_SIZE = 20

/**
 * Infinite, URL-filtered list of OPEN projects for the student marketplace.
 * The query key includes the reactive `queryArgs`, so changing a filter (which
 * writes to the URL) refetches automatically.
 */
export function useProjects() {
  const { queryArgs } = useProjectFilters()

  const query = useInfiniteQuery({
    queryKey: ['projects', queryArgs],
    queryFn: ({ pageParam }) =>
      projectsApi.list({
        ...queryArgs.value,
        status: 'open',
        limit: PAGE_SIZE,
        offset: pageParam as number,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: Project[], allPages: Project[][]) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
  })

  const projects = computed<Project[]>(() => query.data.value?.pages.flat() ?? [])

  return { query, projects }
}
