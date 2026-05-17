import { gqlFetch } from './graphql-client';

export type SubmissionStatus =
  | 'submitted'
  | 'approved'
  | 'revision_requested';

export type Submission = {
  id: string;
  projectId: string;
  studentId: string;
  fileUrls: string[];
  notes: string | null;
  status: SubmissionStatus;
  feedback: string | null;
  submittedAt: string;
  reviewedAt: string | null;
};

const SUBMISSION_FRAGMENT = `
  id
  projectId
  studentId
  fileUrls
  notes
  status
  feedback
  submittedAt
  reviewedAt
`;

const GET_SUBMISSION = `
  query Submission($projectId: ID!) {
    submission(projectId: $projectId) { ${SUBMISSION_FRAGMENT} }
  }
`;

const SUBMIT_WORK = `
  mutation SubmitWork($input: SubmitWorkInput!) {
    submitWork(input: $input) { ${SUBMISSION_FRAGMENT} }
  }
`;

const REVIEW_SUBMISSION = `
  mutation ReviewSubmission($projectId: ID!, $approve: Boolean!, $feedback: String) {
    reviewSubmission(projectId: $projectId, approve: $approve, feedback: $feedback) {
      ${SUBMISSION_FRAGMENT}
    }
  }
`;

export type SubmitWorkInput = {
  projectId: string;
  fileUrls: string[];
  notes?: string;
};

export const submissionsApi = {
  get: (projectId: string) =>
    gqlFetch<{ submission: Submission | null }>(GET_SUBMISSION, { projectId }).then(
      (r) => r.submission,
    ),

  submit: (input: SubmitWorkInput) =>
    gqlFetch<{ submitWork: Submission }>(SUBMIT_WORK, { input }).then(
      (r) => r.submitWork,
    ),

  review: (projectId: string, approve: boolean, feedback?: string) =>
    gqlFetch<{ reviewSubmission: Submission }>(REVIEW_SUBMISSION, {
      projectId,
      approve,
      feedback,
    }).then((r) => r.reviewSubmission),
};
