import { useQuery } from '@tanstack/react-query';

import { profileApi } from '@/lib/profile-api';
import { useAuthStore } from '@/store/auth-store';

export const useMe = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['me'],
    queryFn: () => profileApi.getMe(),
    enabled: !!accessToken,
    staleTime: 1000 * 30,
  });
};
