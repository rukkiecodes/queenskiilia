export interface PortfolioItem {
  id: string
  studentId: string
  projectId: string
  projectTitle: string
  businessName: string
  description: string | null
  skills: string[]
  fileUrls: string[]
  imageUrls: string[]
  videoUrl: string | null
  liveUrl: string | null
  clientRating: number | null
  clientReview: string | null
  isPublic: boolean
  likeCount: number
  likedByMe: boolean
  completedAt: string
  createdAt: string
}

export interface UpdatePortfolioItemInput {
  description?: string
  imageUrls?: string[]
  videoUrl?: string
  liveUrl?: string
}
