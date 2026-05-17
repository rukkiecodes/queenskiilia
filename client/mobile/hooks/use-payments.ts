import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { paymentsApi, type InitiateEscrowInput } from '@/lib/payments-api';

export const useMyEscrows = () =>
  useQuery({
    queryKey: ['my-escrows'],
    queryFn: () => paymentsApi.myEscrows(),
    staleTime: 1000 * 30,
  });

export const useEscrowForProject = (projectId: string | undefined) =>
  useQuery({
    queryKey: ['escrow', projectId],
    queryFn: () => paymentsApi.forProject(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 30,
  });

export const useTransactions = (escrowId: string | undefined) =>
  useQuery({
    queryKey: ['transactions', escrowId],
    queryFn: () => paymentsApi.transactions(escrowId!),
    enabled: !!escrowId,
    staleTime: 1000 * 30,
  });

export const useInitiateEscrow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InitiateEscrowInput) => paymentsApi.initiate(input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['my-escrows'] });
      qc.invalidateQueries({ queryKey: ['escrow', vars.projectId] });
      qc.invalidateQueries({ queryKey: ['my-projects'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useReleaseFunds = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => paymentsApi.release(projectId),
    onSuccess: (_data, projectId) => {
      qc.invalidateQueries({ queryKey: ['my-escrows'] });
      qc.invalidateQueries({ queryKey: ['escrow', projectId] });
    },
  });
};

export const useRefundEscrow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => paymentsApi.refund(projectId),
    onSuccess: (_data, projectId) => {
      qc.invalidateQueries({ queryKey: ['my-escrows'] });
      qc.invalidateQueries({ queryKey: ['escrow', projectId] });
    },
  });
};
