export type ReviewerType = 'student' | 'business'

export interface Rating {
  id: string
  projectId: string
  reviewerId: string
  revieweeId: string
  reviewerType: ReviewerType
  quality: number | null
  communication: number | null
  speed: number | null
  professionalism: number | null
  paymentFairness: number | null
  clarity: number | null
  respect: number | null
  comment: string | null
  createdAt: string
}

export interface SubmitRatingInput {
  projectId: string
  revieweeId: string
  reviewerType: ReviewerType
  quality?: number
  communication?: number
  speed?: number
  professionalism?: number
  paymentFairness?: number
  clarity?: number
  respect?: number
  comment?: string
}
