import { parse } from 'graphql';

export const typeDefs = parse(`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable", "@external", "@requires"])

  type Query {
    portfolioItem(id: ID!): PortfolioItem
    myPortfolio: [PortfolioItem!]!
    studentPortfolio(studentId: ID!): [PortfolioItem!]!
  }

  type Mutation {
    updatePortfolioItemVisibility(id: ID!, isPublic: Boolean!): PortfolioItem!
  }

  type PortfolioItem @key(fields: "id") {
    id:           ID!
    studentId:    ID!
    projectId:    ID!
    projectTitle: String!
    businessName: String!
    description:  String
    skills:       [String!]!
    fileUrls:     [String!]!
    clientRating: Float
    clientReview: String
    isPublic:     Boolean!
    completedAt:  String!
    createdAt:    String!
  }
`);
