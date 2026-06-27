import { parse } from 'graphql';

export const typeDefs = parse(`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable", "@external", "@requires"])

  type Query {
    project(id: ID!): Project
    projects(
      status: String
      search: String
      skillLevel: String
      budgetMin: Float
      budgetMax: Float
      sortBy: String
      limit: Int
      offset: Int
    ): [Project!]!
    myProjects: [Project!]!
    application(id: ID!): Application
    projectApplications(projectId: ID!): [Application!]!
    myApplications: [Application!]!
    submission(projectId: ID!): Submission
  }

  type Mutation {
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    cancelProject(id: ID!): Project!
    applyToProject(input: ApplyInput!): Application!
    withdrawApplication(applicationId: ID!): Application!
    selectStudent(projectId: ID!, studentId: ID!): Project!
    submitWork(input: SubmitWorkInput!): Submission!
    reviewSubmission(projectId: ID!, approve: Boolean!, feedback: String): Submission!
  }

  type Project @key(fields: "id") {
    id: ID!
    businessId: ID!
    title: String!
    description: String!
    requiredSkills: [String!]!
    skillLevel: String!
    budget: Float!
    currency: String!
    # Cover image for the project (default applied client-side when null).
    thumbnailUrl: String
    # Days the talent has to deliver, counted from when they're selected.
    durationDays: Int
    # Concrete due date — null until a talent is selected, then NOW() + durationDays.
    deadline: String
    status: String!
    selectedStudent: ID
    # The employer who posted it (resolved from user-service via federation).
    business: User
    createdAt: String!
    updatedAt: String!
  }

  # Federation stub — the full User is owned by user-service.
  type User @key(fields: "id") {
    id: ID!
  }

  type Application @key(fields: "id") {
    id: ID!
    projectId: ID!
    studentId: ID!
    coverNote: String
    status: String!
    appliedAt: String!
  }

  type Submission @key(fields: "id") {
    id: ID!
    projectId: ID!
    studentId: ID!
    fileUrls: [String!]!
    notes: String
    status: String!
    feedback: String
    submittedAt: String!
    reviewedAt: String
  }

  input CreateProjectInput {
    title: String!
    description: String!
    requiredSkills: [String!]!
    skillLevel: String!
    budget: Float!
    currency: String
    thumbnailUrl: String
    durationDays: Int!
  }

  input UpdateProjectInput {
    title: String
    description: String
    requiredSkills: [String!]
    skillLevel: String
    budget: Float
    thumbnailUrl: String
    durationDays: Int
  }

  input ApplyInput {
    projectId: ID!
    coverNote: String
  }

  input SubmitWorkInput {
    projectId: ID!
    fileUrls: [String!]!
    notes: String
  }
`);
