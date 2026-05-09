import { useMutation, useQueryClient } from '@tanstack/react-query';

import { gqlFetch } from '@/lib/graphql-client';
import type { UserVerification } from '@/lib/profile-api';
import type { VerificationType } from '@/lib/verification-steps';

const SUBMIT_VERIFICATION = `
  mutation SubmitVerification($input: SubmitVerificationInput!) {
    submitVerification(input: $input) {
      id
      userId
      type
      status
      documentUrl
      adminNote
      submittedAt
      reviewedAt
    }
  }
`;

type Vars = {
  type: VerificationType;
  documentUrl: string;
};

export const useSubmitVerification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, documentUrl }: Vars) =>
      gqlFetch<{ submitVerification: UserVerification }>(SUBMIT_VERIFICATION, {
        input: { type, documentUrl },
      }).then((r) => r.submitVerification),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
};
