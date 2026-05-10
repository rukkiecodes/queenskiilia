import { useMutation, useQueryClient } from '@tanstack/react-query';

import { projectsApi } from '@/lib/projects-api';

export const useApplyToProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, coverNote }: { projectId: string; coverNote: string }) =>
      projectsApi.apply(projectId, coverNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-applications'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useWithdrawApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) => projectsApi.withdraw(applicationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-applications'] });
    },
  });
};
