import { useInfiniteQuery } from '@tanstack/vue-query'
import { profileApi } from '~/lib/profile-api'
import { useTalentFilters } from '~/composables/use-talent-filters'
import type { PublicUser } from '~/types/profile'

const PAGE_SIZE = 20

/** Infinite, URL-filtered student directory (the `users` query is public). */
export function useTalentSearch() {
  const { queryArgs } = useTalentFilters()

  const query = useInfiniteQuery({
    queryKey: ['talent', queryArgs],
    queryFn: ({ pageParam }) =>
      profileApi.searchUsers({ ...queryArgs.value, limit: PAGE_SIZE, offset: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: PublicUser[], allPages: PublicUser[][]) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
  })

  const talents = computed<PublicUser[]>(() => query.data.value?.pages.flat() ?? [])

  return { query, talents }
}
