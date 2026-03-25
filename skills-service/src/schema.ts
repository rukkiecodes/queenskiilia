import { parse } from 'graphql';

export const typeDefs = parse(`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable", "@external", "@requires"])

  type Query {
    skillCategories: [SkillCategory!]!
    skillCategory(id: ID!): SkillCategory
    myAssessments: [SkillAssessment!]!
    assessment(id: ID!): SkillAssessment
    activeAssessmentSession: AssessmentSession
  }

  type Mutation {
    startAssessment(category: String!, level: String!): AssessmentSession!
    submitAssessment(sessionId: ID!, answers: [AnswerInput!]!): SkillAssessment!
  }

  type SkillCategory @key(fields: "id") {
    id: ID!
    name: String!
    parentCategory: String
    skills: [String!]!
  }

  type SkillAssessment @key(fields: "id") {
    id: ID!
    studentId: ID!
    category: String!
    level: String!
    score: Int
    completedAt: String!
  }

  type AssessmentSession @key(fields: "id") {
    id: ID!
    studentId: ID!
    category: String!
    questions: [Question!]!
    status: String!
    startedAt: String!
    expiresAt: String!
  }

  type Question {
    index: Int!
    text: String!
    options: [String!]!
  }

  input AnswerInput {
    questionIndex: Int!
    selectedOption: Int!
  }
`);
