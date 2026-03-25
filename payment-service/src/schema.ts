import { parse } from 'graphql';

export const typeDefs = parse(`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable", "@external", "@requires"])

  type Query {
    escrow(projectId: ID!): EscrowAccount
    myEscrows: [EscrowAccount!]!
    transactions(escrowId: ID!): [PaymentTransaction!]!
    milestones(escrowId: ID!): [Milestone!]!
  }

  type Mutation {
    initiateEscrow(input: InitiateEscrowInput!): EscrowAccount!
    releaseFunds(projectId: ID!): EscrowAccount!
    refundEscrow(projectId: ID!): EscrowAccount!
    addMilestone(input: AddMilestoneInput!): Milestone!
    releaseMilestone(milestoneId: ID!): Milestone!
  }

  type EscrowAccount @key(fields: "id") {
    id:          ID!
    projectId:   ID!
    businessId:  ID!
    studentId:   ID!
    amount:      Float!
    currency:    String!
    gateway:     String!
    gatewayRef:  String
    status:      String!
    platformFee: Float
    createdAt:   String!
    releasedAt:  String
  }

  type Milestone @key(fields: "id") {
    id:         ID!
    escrowId:   ID!
    label:      String!
    amount:     Float!
    percentage: Int
    status:     String!
    releasedAt: String
  }

  type PaymentTransaction @key(fields: "id") {
    id:         ID!
    userId:     ID!
    escrowId:   ID!
    type:       String!
    amount:     Float!
    currency:   String!
    gatewayRef: String
    createdAt:  String!
  }

  input InitiateEscrowInput {
    projectId:  ID!
    studentId:  ID!
    amount:     Float!
    currency:   String
    gateway:    String
    gatewayRef: String
  }

  input AddMilestoneInput {
    escrowId:   ID!
    label:      String!
    amount:     Float!
    percentage: Int
  }
`);
