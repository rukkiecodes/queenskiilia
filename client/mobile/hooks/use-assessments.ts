import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { skillsApi, type AnswerInput, type SkillLevel } from '@/lib/skills-api';

export const useSkillCategories = () =>
  useQuery({
    queryKey: ['skill-categories'],
    queryFn: () => skillsApi.categories(),
    staleTime: 1000 * 60 * 60, // categories rarely change
  });

export const useMyAssessments = () =>
  useQuery({
    queryKey: ['my-assessments'],
    queryFn: () => skillsApi.myAssessments(),
    staleTime: 1000 * 30,
  });

export const useAssessment = (id: string | undefined) =>
  useQuery({
    queryKey: ['assessment', id],
    queryFn: () => skillsApi.assessment(id!),
    enabled: !!id,
    staleTime: 1000 * 60,
  });

export const useActiveSession = () =>
  useQuery({
    queryKey: ['active-session'],
    queryFn: () => skillsApi.activeSession(),
    staleTime: 1000 * 10,
  });

export const useStartAssessment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ category, level }: { category: string; level: SkillLevel }) =>
      skillsApi.start(category, level),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-session'] });
    },
  });
};

export const useSubmitAssessment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      answers,
    }: {
      sessionId: string;
      answers: AnswerInput[];
    }) => skillsApi.submit(sessionId, answers),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-session'] });
      qc.invalidateQueries({ queryKey: ['my-assessments'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
};
