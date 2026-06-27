import type { ProjectSort, SkillLevel } from '~/types/filters'

export type ProjectStatus =
  | 'open'
  | 'in_progress'
  | 'under_review'
  | 'completed'
  | 'disputed'
  | 'cancelled'

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'

/** The employer shown on a gig listing / detail (resolved via federation). */
export interface ProjectBusiness {
  id: string
  fullName: string | null
  avatarUrl: string | null
  country?: string | null
  isVerified?: boolean
  verifiedBadge?: string | null
  createdAt?: string
  businessProfile: {
    companyName: string | null
    website?: string | null
    industry?: string | null
    country?: string | null
    description?: string | null
    totalProjectsPosted?: number
    averageRating?: number | null
  } | null
}

export interface Project {
  id: string
  businessId: string
  title: string
  description: string
  requiredSkills: string[]
  skillLevel: SkillLevel
  budget: number
  currency: string
  /** Project cover image; default applied client-side when null. */
  thumbnailUrl: string | null
  /** Days the talent has to deliver, counted from selection. */
  durationDays: number | null
  /** Concrete due date — null until a talent is selected. */
  deadline: string | null
  status: ProjectStatus
  selectedStudent: string | null
  business: ProjectBusiness | null
  createdAt: string
  updatedAt: string
}

export interface Application {
  id: string
  projectId: string
  studentId: string
  coverNote: string | null
  status: ApplicationStatus
  appliedAt: string
}

export interface CreateProjectInput {
  title: string
  description: string
  requiredSkills: string[]
  skillLevel: SkillLevel
  budget: number
  currency: string
  thumbnailUrl?: string
  durationDays: number
}

export interface ListProjectsArgs {
  status?: ProjectStatus
  search?: string
  skillLevel?: SkillLevel
  budgetMin?: number
  budgetMax?: number
  sortBy?: ProjectSort
  limit?: number
  offset?: number
}
