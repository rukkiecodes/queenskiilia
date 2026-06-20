export type SubmissionStatus = 'submitted' | 'approved' | 'revision_requested' | 'pending'

export interface Submission {
  id: string
  projectId: string
  studentId: string
  fileUrls: string[]
  notes: string | null
  status: SubmissionStatus
  feedback: string | null
  submittedAt: string
  reviewedAt: string | null
}

export interface SubmitWorkInput {
  projectId: string
  fileUrls: string[]
  notes?: string
}
