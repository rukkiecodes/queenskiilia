import { gqlFetch } from '~/lib/graphql-client'
import type {
  BusinessProfile,
  Me,
  PublicUser,
  SearchUsersArgs,
  StudentProfile,
  SubmitVerificationInput,
  UpdateBusinessProfileInput,
  UpdateProfileInput,
  UpdateStudentProfileInput,
  UserVerification,
} from '~/types/profile'

// Operation strings ported verbatim from client/mobile/lib/profile-api.ts.
const ME_FRAGMENT = `
  id
  email
  accountType
  fullName
  avatarUrl
  country
  emailVerified
  phoneVerified
  isVerified
  verifiedBadge
  isActive
  isFlagged
  createdAt
  updatedAt
  studentProfile {
    userId bio university graduationYear skills skillLevel
    totalEarnings averageRating portfolioUrl updatedAt
  }
  businessProfile {
    userId companyName website industry country description
    totalProjectsPosted averageRating updatedAt
  }
  verifications {
    id userId type status documentUrl adminNote submittedAt reviewedAt
  }
`

const GET_ME = `query GetMe { me { ${ME_FRAGMENT} } }`

const PUBLIC_USER_FIELDS = `
  id email accountType fullName avatarUrl country isVerified
  businessProfile { companyName website industry }
  studentProfile { university skillLevel skills averageRating }
`

const GET_USER = `query GetUser($id: ID!) { user(id: $id) { ${PUBLIC_USER_FIELDS} } }`

const SEARCH_USERS = `
  query SearchUsers(
    $accountType: String, $search: String, $skillLevel: String,
    $country: String, $minRating: Float, $limit: Int, $offset: Int
  ) {
    users(
      accountType: $accountType, search: $search, skillLevel: $skillLevel,
      country: $country, minRating: $minRating, limit: $limit, offset: $offset
    ) { ${PUBLIC_USER_FIELDS} }
  }
`

const UPDATE_PROFILE = `mutation UpdateProfile($input: UpdateProfileInput!) { updateProfile(input: $input) { ${ME_FRAGMENT} } }`

const UPDATE_STUDENT_PROFILE = `
  mutation UpdateStudentProfile($input: UpdateStudentProfileInput!) {
    updateStudentProfile(input: $input) {
      userId bio university graduationYear skills skillLevel
      totalEarnings averageRating portfolioUrl updatedAt
    }
  }
`

const UPDATE_BUSINESS_PROFILE = `
  mutation UpdateBusinessProfile($input: UpdateBusinessProfileInput!) {
    updateBusinessProfile(input: $input) {
      userId companyName website industry country description
      totalProjectsPosted averageRating updatedAt
    }
  }
`

const SUBMIT_VERIFICATION = `
  mutation SubmitVerification($input: SubmitVerificationInput!) {
    submitVerification(input: $input) {
      id userId type status documentUrl adminNote submittedAt reviewedAt
    }
  }
`

export const profileApi = {
  getMe: () => gqlFetch<{ me: Me | null }>(GET_ME).then((r) => r.me),

  getUserById: (id: string) =>
    gqlFetch<{ user: PublicUser | null }>(GET_USER, { id }).then((r) => r.user),

  searchUsers: (args: SearchUsersArgs = {}) => {
    const { limit = 20, offset = 0, ...rest } = args
    return gqlFetch<{ users: PublicUser[] }>(SEARCH_USERS, { ...rest, limit, offset }).then(
      (r) => r.users,
    )
  },

  updateProfile: (input: UpdateProfileInput) =>
    gqlFetch<{ updateProfile: Me }>(UPDATE_PROFILE, { input }).then((r) => r.updateProfile),

  updateStudentProfile: (input: UpdateStudentProfileInput) =>
    gqlFetch<{ updateStudentProfile: StudentProfile }>(UPDATE_STUDENT_PROFILE, { input }).then(
      (r) => r.updateStudentProfile,
    ),

  updateBusinessProfile: (input: UpdateBusinessProfileInput) =>
    gqlFetch<{ updateBusinessProfile: BusinessProfile }>(UPDATE_BUSINESS_PROFILE, { input }).then(
      (r) => r.updateBusinessProfile,
    ),

  submitVerification: (input: SubmitVerificationInput) =>
    gqlFetch<{ submitVerification: UserVerification }>(SUBMIT_VERIFICATION, { input }).then(
      (r) => r.submitVerification,
    ),
}
