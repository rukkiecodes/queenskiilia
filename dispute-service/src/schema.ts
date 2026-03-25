import { parse } from 'graphql';

export const typeDefs = parse(`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable", "@external", "@requires"])

  type Query {
    dispute(id: ID!): Dispute
    projectDispute(projectId: ID!): Dispute
    myDisputes: [Dispute!]!
  }

  type Mutation {
    raiseDispute(input: RaiseDisputeInput!): Dispute!
    resolveDispute(id: ID!, resolution: String!, adminNote: String): Dispute!
  }

  type Dispute @key(fields: "id") {
    id:         ID!
    projectId:  ID!
    raisedBy:   ID!
    reason:     String!
    evidence:   [String!]!
    status:     String!
    resolution: String
    adminNote:  String
    createdAt:  String!
    resolvedAt: String
  }

  input RaiseDisputeInput {
    projectId: ID!
    reason:    String!
    evidence:  [String!]
  }
`);
