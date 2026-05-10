import { useMutation, useQueryClient } from '@tanstack/react-query';

import { projectsApi, type CreateProjectInput } from '@/lib/projects-api';

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

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-projects'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useCancelProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-projects'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useSelectStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, studentId }: { projectId: string; studentId: string }) =>
      projectsApi.selectStudent(projectId, studentId),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['my-projects'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['project-applications', projectId] });
    },
  });
};

