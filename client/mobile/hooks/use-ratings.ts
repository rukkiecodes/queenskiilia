import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ratingsApi, type SubmitRatingInput } from '@/lib/ratings-api';

export const useUserRatings = (userId: string | undefined) =>
  useQuery({
    queryKey: ['user-ratings', userId],
    queryFn: () => ratingsApi.forUser(userId!),
    enabled: !!userId,
    staleTime: 1000 * 30,
  });

export const useProjectRatings = (projectId: string | undefined) =>
  useQuery({
    queryKey: ['project-ratings', projectId],
    queryFn: () => ratingsApi.forProject(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 30,
  });

export const useSubmitRating = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitRatingInput) => ratingsApi.submit(input),
    onSuccess: (rating) => {
      qc.invalidateQueries({ queryKey: ['user-ratings', rating.revieweeId] });
      qc.invalidateQueries({ queryKey: ['user', rating.revieweeId] });
      qc.invalidateQueries({ queryKey: ['project-ratings', rating.projectId] });
    },
  });
};
