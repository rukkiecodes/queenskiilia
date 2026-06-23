import type { AccountType } from '~/types/auth'

export interface StudentProfile {
  userId: string
  bio: string | null
  university: string | null
  graduationYear: number | null
  skills: string[]
  skillLevel: string | null
  totalEarnings: number
  averageRating: number | null
  portfolioUrl: string | null
  updatedAt: string
}

export interface BusinessProfile {
  userId: string
  companyName: string
  website: string | null
  industry: string | null
  country: string | null
  description: string | null
  totalProjectsPosted: number
  averageRating: number | null
  updatedAt: string
}

export type VerificationStatus = 'pending' | 'approved' | 'rejected'

export interface UserVerification {
  id: string
  userId: string
  type: string
  status: VerificationStatus
  documentUrl: string | null
  adminNote: string | null
  submittedAt: string
  reviewedAt: string | null
}

export interface Me {
  id: string
  email: string
  accountType: AccountType
  fullName: string | null
  avatarUrl: string | null
  country: string | null
  emailVerified: boolean
  phoneVerified: boolean
  isVerified: boolean
  verifiedBadge: string | null
  isActive: boolean
  isFlagged: boolean
  createdAt: string
  updatedAt: string
  studentProfile: StudentProfile | null
  businessProfile: BusinessProfile | null
  verifications: UserVerification[]
}

/** Lean projection used when viewing another user's public profile (Feature 08). */
export interface PublicUser {
  id: string
  email: string
  accountType: AccountType
  fullName: string | null
  avatarUrl: string | null
  country: string | null
  isVerified: boolean
  businessProfile: { companyName: string; website: string | null; industry: string | null } | null
  studentProfile: {
    university: string | null
    skillLevel: string | null
    skills: string[]
    averageRating: number | null
  } | null
}

export interface UpdateProfileInput {
  fullName?: string
  country?: string
  avatarUrl?: string
}

export interface UpdateStudentProfileInput {
  bio?: string
  university?: string
  graduationYear?: number
  skills?: string[]
  skillLevel?: string
  portfolioUrl?: string
}

export interface UpdateBusinessProfileInput {
  companyName?: string
  website?: string
  industry?: string
  country?: string
  description?: string
}

export interface SubmitVerificationInput {
  type: string
  documentUrl?: string
}

export interface SearchUsersArgs {
  accountType?: AccountType
  search?: string
  skillLevel?: string
  country?: string
  minRating?: number
  limit?: number
  offset?: number
}
