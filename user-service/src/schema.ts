import { parse } from 'graphql';

export const typeDefs = parse(`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable", "@external", "@requires"])

  type Query {
    me: User
    user(id: ID!): User
    users(
      accountType: String
      search: String
      skillLevel: String
      country: String
      minRating: Float
      limit: Int
      offset: Int
    ): [User!]!

    # Admin-only (gated by ctx.isAdmin via the x-user-admin header)
    adminStats: AdminStats!
    adminVerifications(status: String, limit: Int, offset: Int): [AdminVerification!]!
    adminUsers(search: String, accountType: String, limit: Int, offset: Int): [AdminUserSummary!]!
  }

  type AdminStats {
    totalUsers: Int!
    students: Int!
    businesses: Int!
    verifiedUsers: Int!
    pendingVerifications: Int!
    totalProjects: Int!
    openProjects: Int!
    completedProjects: Int!
    openDisputes: Int!
    pendingReports: Int!
    escrowHeld: Float!
    escrowReleased: Float!
  }

  type AdminUserSummary {
    id: ID!
    email: String!
    fullName: String
    accountType: String!
    isVerified: Boolean!
    isActive: Boolean!
    country: String
    createdAt: String!
  }

  type AdminVerification {
    id: ID!
    userId: ID!
    type: String!
    status: String!
    documentUrl: String
    adminNote: String
    submittedAt: String!
    reviewedAt: String
    user: AdminUserSummary
  }

  type Mutation {
    updateProfile(input: UpdateProfileInput!): User!
    updateStudentProfile(input: UpdateStudentProfileInput!): StudentProfile!
    updateBusinessProfile(input: UpdateBusinessProfileInput!): BusinessProfile!
    submitVerification(input: SubmitVerificationInput!): UserVerification!
    uploadAvatar(base64: String!, mimeType: String!): User!

    # Admin-only (gated by ctx.isAdmin)
    reviewVerification(id: ID!, decision: String!, adminNote: String): AdminVerification!
    setUserActive(id: ID!, isActive: Boolean!): AdminUserSummary!
    setUserVerified(id: ID!, isVerified: Boolean!): AdminUserSummary!

    """
    Soft-deletes the authenticated user (Google Play 2024+ compliance).
    Sets is_active=FALSE, stamps deletion_requested_at, revokes all refresh
    tokens. A separate cleanup job tombstones rows after the 30-day grace
    window. \`confirmation\` must equal "DELETE".
    """
    deleteAccount(confirmation: String!): Boolean!
  }

  type User @key(fields: "id") {
    id:              ID!
    email:           String!
    accountType:     String!
    fullName:        String
    avatarUrl:       String
    country:         String
    emailVerified:   Boolean!
    phoneVerified:   Boolean!
    isVerified:      Boolean!
    verifiedBadge:   String
    isActive:        Boolean!
    isFlagged:       Boolean!
    createdAt:       String!
    updatedAt:       String!
    studentProfile:  StudentProfile
    businessProfile: BusinessProfile
    verifications:   [UserVerification!]!
  }

  type StudentProfile {
    userId:         ID!
    bio:            String
    university:     String
    graduationYear: Int
    skills:         [String!]!
    skillLevel:     String
    totalEarnings:  Float!
    averageRating:  Float
    portfolioUrl:   String
    updatedAt:      String!
  }

  type BusinessProfile {
    userId:              ID!
    companyName:         String!
    website:             String
    industry:            String
    country:             String
    description:         String
    totalProjectsPosted: Int!
    averageRating:       Float
    updatedAt:           String!
  }

  type UserVerification {
    id:          ID!
    userId:      ID!
    type:        String!
    status:      String!
    documentUrl: String
    adminNote:   String
    submittedAt: String!
    reviewedAt:  String
  }

  input UpdateProfileInput {
    fullName:  String
    country:   String
    avatarUrl: String
  }

  input UpdateStudentProfileInput {
    bio:            String
    university:     String
    graduationYear: Int
    skills:         [String!]
    skillLevel:     String
    portfolioUrl:   String
  }

  input UpdateBusinessProfileInput {
    companyName: String
    website:     String
    industry:    String
    country:     String
    description: String
  }

  input SubmitVerificationInput {
    type:        String!
    documentUrl: String
  }
`);
