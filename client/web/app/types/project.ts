import type { ProjectSort, SkillLevel } from '~/types/filters'

export type ProjectStatus =
  | 'open'
  | 'in_progress'
  | 'under_review'
  | 'completed'
  | 'disputed'
  | 'cancelled'

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'

export interface Project {
  id: string
  businessId: string
  title: string
  description: string
  requiredSkills: string[]
  skillLevel: SkillLevel
  budget: number
  currency: string
  deadline: string
  status: ProjectStatus
  selectedStudent: string | null
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
  deadline: string
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
