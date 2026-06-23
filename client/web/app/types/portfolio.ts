export interface PortfolioItem {
  id: string
  studentId: string
  projectId: string
  projectTitle: string
  businessName: string
  description: string | null
  skills: string[]
  fileUrls: string[]
  clientRating: number | null
  clientReview: string | null
  isPublic: boolean
  completedAt: string
  createdAt: string
}
