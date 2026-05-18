import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { disputesApi, type RaiseDisputeInput } from '@/lib/disputes-api';

export const useProjectDispute = (projectId: string | undefined) =>
  useQuery({
    queryKey: ['project-dispute', projectId],
    queryFn: () => disputesApi.forProject(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 15,
  });

export const useRaiseDispute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RaiseDisputeInput) => disputesApi.raise(input),
    onSuccess: (dispute) => {
      qc.invalidateQueries({ queryKey: ['project-dispute', dispute.projectId] });
      qc.invalidateQueries({ queryKey: ['project', dispute.projectId] });
      qc.invalidateQueries({ queryKey: ['my-projects'] });
      qc.invalidateQueries({ queryKey: ['my-escrows'] });
      qc.invalidateQueries({ queryKey: ['escrow', dispute.projectId] });
    },
  });
};
