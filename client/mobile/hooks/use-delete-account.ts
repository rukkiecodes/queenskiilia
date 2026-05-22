import { useMutation } from '@tanstack/react-query';

import { accountApi } from '@/lib/account-api';

export const useDeleteAccount = () =>
  useMutation({
    // Confirmation gating happens server-side too — the UI types-to-confirm
    // is only the first checkpoint, the resolver rejects anything but "DELETE".
    mutationFn: (confirmation: string) => accountApi.deleteAccount(confirmation),
  });
