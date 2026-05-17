import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { paymentsApi } from '@/lib/payments-api';
import {
  submissionsApi,
  type SubmitWorkInput,
} from '@/lib/submissions-api';

export const useSubmission = (projectId: string | undefined) =>
  useQuery({
    queryKey: ['submission', projectId],
    queryFn: () => submissionsApi.get(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 15,
  });

export const useSubmitWork = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitWorkInput) => submissionsApi.submit(input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['submission', vars.projectId] });
      qc.invalidateQueries({ queryKey: ['project', vars.projectId] });
    },
  });
};

/**
 * Approving also releases escrow funds in the same UI action. The plan
 * calls this "Approve & Release Funds" — server-side reviewSubmission
 * doesn't auto-release, so we chain `releaseFunds` on the client and
 * surface either failure (approve succeeded but release failed) clearly
 * via the returned `releaseError`.
 */
export const useReviewSubmission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      approve,
      feedback,
    }: {
      projectId: string;
      approve: boolean;
      feedback?: string;
    }) => {
      const submission = await submissionsApi.review(
        projectId,
        approve,
        feedback,
      );
      if (approve) {
        try {
          await paymentsApi.release(projectId);
        } catch (releaseErr) {
          return {
            submission,
            releaseError:
              releaseErr instanceof Error
                ? releaseErr.message
                : 'Could not release funds',
          };
        }
      }
      return { submission, releaseError: null as string | null };
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['submission', vars.projectId] });
      qc.invalidateQueries({ queryKey: ['project', vars.projectId] });
      qc.invalidateQueries({ queryKey: ['my-projects'] });
      qc.invalidateQueries({ queryKey: ['my-escrows'] });
      qc.invalidateQueries({ queryKey: ['escrow', vars.projectId] });
      qc.invalidateQueries({ queryKey: ['my-portfolio'] });
    },
  });
};
