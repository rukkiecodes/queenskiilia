import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { reportsApi, type SubmitReportInput } from '@/lib/reports-api';

const MINE_KEY = ['reports', 'mine'] as const;

export const useMyReports = () =>
  useQuery({
    queryKey: MINE_KEY,
    queryFn: () => reportsApi.mine(),
    // Reports rarely change without the user submitting one; the mutation
    // invalidates this key so we don't need an aggressive stale time.
    staleTime: 1000 * 60,
  });

export const useSubmitReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitReportInput) => reportsApi.submit(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MINE_KEY });
    },
  });
};
