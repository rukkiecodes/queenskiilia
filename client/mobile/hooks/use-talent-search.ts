import { useInfiniteQuery } from '@tanstack/react-query';

import { profileApi, type SearchUsersArgs } from '@/lib/profile-api';

const PAGE_SIZE = 20;

type Filters = Omit<SearchUsersArgs, 'limit' | 'offset' | 'accountType'>;

export const useTalentSearch = (filters: Filters = {}) =>
  useInfiniteQuery({
    queryKey: ['talent-search', filters],
    queryFn: ({ pageParam }) =>
      profileApi.searchUsers({
        ...filters,
        accountType: 'student',
        limit: PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _all, lastPageParam) =>
      lastPage.length === PAGE_SIZE ? lastPageParam + PAGE_SIZE : undefined,
    staleTime: 1000 * 30,
  });
