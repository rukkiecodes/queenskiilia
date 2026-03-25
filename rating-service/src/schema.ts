import { parse } from 'graphql';

export const typeDefs = parse(`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable", "@external", "@requires"])

  type Query {
    rating(id: ID!): Rating
    projectRatings(projectId: ID!): [Rating!]!
    userRatings(userId: ID!): [Rating!]!
    myRatings: [Rating!]!
  }

  type Mutation {
    submitRating(input: SubmitRatingInput!): Rating!
  }

  type Rating @key(fields: "id") {
    id:              ID!
    projectId:       ID!
    reviewerId:      ID!
    revieweeId:      ID!
    reviewerType:    String!
    quality:         Int
    communication:   Int
    speed:           Int
    professionalism: Int
    paymentFairness: Int
    clarity:         Int
    respect:         Int
    comment:         String
    createdAt:       String!
  }

  input SubmitRatingInput {
    projectId:       ID!
    revieweeId:      ID!
    reviewerType:    String!
    quality:         Int
    communication:   Int
    speed:           Int
    professionalism: Int
    paymentFairness: Int
    clarity:         Int
    respect:         Int
    comment:         String
  }
`);
