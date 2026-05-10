import { useQuery } from '@tanstack/react-query';

import { profileApi } from '@/lib/profile-api';

export const useUser = (id: string | undefined) =>
  useQuery({
    queryKey: ['user', id],
    queryFn: () => profileApi.getUserById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
