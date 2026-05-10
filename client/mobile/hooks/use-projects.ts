import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import {
  projectsApi,
  type ListProjectsArgs,
  type ProjectStatus,
} from '@/lib/projects-api';

const PAGE_SIZE = 20;

type Filters = Omit<ListProjectsArgs, 'limit' | 'offset' | 'status'> & {
  status?: ProjectStatus;
};

export const useProjects = (filters: Filters = {}) =>
  useInfiniteQuery({
    queryKey: ['projects', filters],
    queryFn: ({ pageParam }) =>
      projectsApi.list({ ...filters, limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === PAGE_SIZE ? lastPageParam + PAGE_SIZE : undefined,
    staleTime: 1000 * 30,
  });

export const useProject = (id: string | undefined) =>
  useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id!),
    enabled: !!id,
    staleTime: 1000 * 30,
  });

export const useMyApplications = () =>
  useQuery({
    queryKey: ['my-applications'],
    queryFn: () => projectsApi.myApplications(),
    staleTime: 1000 * 30,
  });
