export type DisputeStatus = 'raised' | 'reviewing' | 'resolved' | 'open' | 'under_review'

export interface Dispute {
  id: string
  projectId: string
  raisedBy: string
  reason: string
  evidence: string[]
  status: DisputeStatus
  resolution: string | null
  adminNote: string | null
  createdAt: string
  resolvedAt: string | null
}

export interface RaiseDisputeInput {
  projectId: string
  reason: string
  evidence?: string[]
}
