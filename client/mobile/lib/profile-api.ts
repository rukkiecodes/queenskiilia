import { gqlFetch } from './graphql-client';

export type AccountType = 'student' | 'business';

export type StudentProfile = {
  userId: string;
  bio: string | null;
  university: string | null;
  graduationYear: number | null;
  skills: string[];
  skillLevel: string | null;
  totalEarnings: number;
  averageRating: number | null;
  portfolioUrl: string | null;
  updatedAt: string;
};

export type BusinessProfile = {
  userId: string;
  companyName: string;
  website: string | null;
  industry: string | null;
  country: string | null;
  description: string | null;
  totalProjectsPosted: number;
  averageRating: number | null;
  updatedAt: string;
};

export type UserVerification = {
  id: string;
  userId: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  documentUrl: string | null;
  adminNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
};

export type Me = {
  id: string;
  email: string;
  accountType: AccountType;
  fullName: string | null;
  avatarUrl: string | null;
  country: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  isVerified: boolean;
  verifiedBadge: string | null;
  isActive: boolean;
  isFlagged: boolean;
  createdAt: string;
  updatedAt: string;
  studentProfile: StudentProfile | null;
  businessProfile: BusinessProfile | null;
  verifications: UserVerification[];
};

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
    userId
    bio
    university
    graduationYear
    skills
    skillLevel
    totalEarnings
    averageRating
    portfolioUrl
    updatedAt
  }
  businessProfile {
    userId
    companyName
    website
    industry
    country
    description
    totalProjectsPosted
    averageRating
    updatedAt
  }
  verifications {
    id
    userId
    type
    status
    documentUrl
    adminNote
    submittedAt
    reviewedAt
  }
`;

const GET_ME = `query GetMe { me { ${ME_FRAGMENT} } }`;

/**
 * Lean projection of a User used when viewing a project's business or talent —
 * we only need display fields, not full profile data.
 */
export type PublicUser = {
  id: string;
  email: string;
  accountType: AccountType;
  fullName: string | null;
  avatarUrl: string | null;
  country: string | null;
  isVerified: boolean;
  businessProfile: {
    companyName: string;
    website: string | null;
    industry: string | null;
  } | null;
  studentProfile: {
    university: string | null;
    skillLevel: string | null;
    averageRating: number | null;
  } | null;
};

const GET_USER = `
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      email
      accountType
      fullName
      avatarUrl
      country
      isVerified
      businessProfile {
        companyName
        website
        industry
      }
      studentProfile {
        university
        skillLevel
        averageRating
      }
    }
  }
`;

const UPDATE_PROFILE = `
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) { ${ME_FRAGMENT} }
  }
`;

const UPDATE_STUDENT_PROFILE = `
  mutation UpdateStudentProfile($input: UpdateStudentProfileInput!) {
    updateStudentProfile(input: $input) {
      userId
      bio
      university
      graduationYear
      skills
      skillLevel
      totalEarnings
      averageRating
      portfolioUrl
      updatedAt
    }
  }
`;

const UPDATE_BUSINESS_PROFILE = `
  mutation UpdateBusinessProfile($input: UpdateBusinessProfileInput!) {
    updateBusinessProfile(input: $input) {
      userId
      companyName
      website
      industry
      country
      description
      totalProjectsPosted
      averageRating
      updatedAt
    }
  }
`;

export type UpdateProfileInput = {
  fullName?: string;
  country?: string;
  avatarUrl?: string;
};

export type UpdateStudentProfileInput = {
  bio?: string;
  university?: string;
  graduationYear?: number;
  skills?: string[];
  skillLevel?: string;
  portfolioUrl?: string;
};

export type UpdateBusinessProfileInput = {
  companyName?: string;
  website?: string;
  industry?: string;
  country?: string;
  description?: string;
};

export const profileApi = {
  getMe: () => gqlFetch<{ me: Me | null }>(GET_ME).then((r) => r.me),

  getUserById: (id: string) =>
    gqlFetch<{ user: PublicUser | null }>(GET_USER, { id }).then((r) => r.user),

  updateProfile: (input: UpdateProfileInput) =>
    gqlFetch<{ updateProfile: Me }>(UPDATE_PROFILE, { input }).then(
      (r) => r.updateProfile,
    ),

  updateStudentProfile: (input: UpdateStudentProfileInput) =>
    gqlFetch<{ updateStudentProfile: StudentProfile }>(
      UPDATE_STUDENT_PROFILE,
      { input },
    ).then((r) => r.updateStudentProfile),

  updateBusinessProfile: (input: UpdateBusinessProfileInput) =>
    gqlFetch<{ updateBusinessProfile: BusinessProfile }>(
      UPDATE_BUSINESS_PROFILE,
      { input },
    ).then((r) => r.updateBusinessProfile),
};
