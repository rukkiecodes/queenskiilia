import { parse } from 'graphql';

export const typeDefs = parse(`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable", "@external", "@requires"])

  type Query {
    me: User
    user(id: ID!): User
    users(limit: Int, offset: Int): [User!]!
  }

  type Mutation {
    updateProfile(input: UpdateProfileInput!): User!
    updateStudentProfile(input: UpdateStudentProfileInput!): StudentProfile!
    updateBusinessProfile(input: UpdateBusinessProfileInput!): BusinessProfile!
    submitVerification(input: SubmitVerificationInput!): UserVerification!
    uploadAvatar(base64: String!, mimeType: String!): User!
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
