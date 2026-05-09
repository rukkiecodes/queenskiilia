import { useMutation } from '@tanstack/react-query';

import { authApi, type AccountType } from '@/lib/auth-api';
import { useAuthStore } from '@/store/auth-store';

export const useRequestOtp = () =>
  useMutation({
    mutationFn: ({ email, accountType }: { email: string; accountType: AccountType }) =>
      authApi.requestOtp(email, accountType),
  });

export const useVerifyOtp = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
      const res = await authApi.verifyOtp(email, otp);
      await setAuth(res.user, res.accessToken, res.refreshToken);
      return res;
    },
  });
};
