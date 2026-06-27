import { gqlFetch } from './graphql-client';

// Allow-lists are mirrored in dispute-service/src/resolvers/report.ts — keep
// them in lock-step or the resolver will reject the request with BAD_USER_INPUT.

export type ReportTargetType = 'user' | 'project' | 'message';
export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'inappropriate'
  | 'scam'
  | 'other';
export type ReportStatus = 'open' | 'reviewed' | 'dismissed' | 'actioned';

export type Report = {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export type SubmitReportInput = {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
};

/** Human label for each reason code — drives the radio list in the UI. */
export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam:          'Spam',
  harassment:    'Harassment or hate speech',
  inappropriate: 'Inappropriate content',
  scam:          'Scam or fraud',
  other:         'Something else',
};

const REPORT_FRAGMENT = `
  id
  reporterId
  targetType
  targetId
  reason
  details
  status
  adminNote
  createdAt
  reviewedAt
`;

const SUBMIT_REPORT = `
  mutation SubmitReport($input: SubmitReportInput!) {
    submitReport(input: $input) { ${REPORT_FRAGMENT} }
  }
`;

const MY_REPORTS = `query MyReports { myReports { ${REPORT_FRAGMENT} } }`;

export const reportsApi = {
  submit: (input: SubmitReportInput) =>
    gqlFetch<{ submitReport: Report }>(SUBMIT_REPORT, { input }).then(
      (r) => r.submitReport,
    ),

  mine: () =>
    gqlFetch<{ myReports: Report[] }>(MY_REPORTS).then((r) => r.myReports),
};
