export type ReportTargetType = 'user' | 'project' | 'message'
export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'scam' | 'other'
export type ReportStatus = 'open' | 'reviewed' | 'dismissed' | 'actioned'

export interface Report {
  id: string
  reporterId: string
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  details: string | null
  status: ReportStatus
  adminNote: string | null
  createdAt: string
  reviewedAt: string | null
}

export interface SubmitReportInput {
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  details?: string
}

/** Human labels (kept in lock-step with dispute-service/src/resolvers/report.ts). */
export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: 'Spam',
  harassment: 'Harassment or hate speech',
  inappropriate: 'Inappropriate content',
  scam: 'Scam or fraud',
  other: 'Something else',
}
