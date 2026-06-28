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

    # Admin-only exam authoring (gated by ctx.isAdmin via x-user-admin)
    adminSkills: [Skill!]!
    adminExams(skillId: ID, level: String, status: String): [Exam!]!
    adminExam(id: ID!): Exam
  }

  type Mutation {
    startAssessment(category: String!, level: String!): AssessmentSession!
    submitAssessment(sessionId: ID!, answers: [AnswerInput!]!): SkillAssessment!

    # Admin-only exam authoring
    createSkill(name: String!, category: String): Skill!
    createExam(input: CreateExamInput!): Exam!
    updateExam(id: ID!, input: UpdateExamInput!): Exam!
    generateExamQuestions(examId: ID!, count: Int!, types: [String!]): [ExamQuestion!]!
    addQuestion(examId: ID!, input: QuestionInput!): ExamQuestion!
    updateQuestion(id: ID!, input: QuestionInput!): ExamQuestion!
    deleteQuestion(id: ID!): Boolean!
    reorderQuestions(examId: ID!, questionIds: [ID!]!): Boolean!
    publishExam(id: ID!): Exam!
    archiveExam(id: ID!): Exam!
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

  # ── Skill certification exams (admin authoring) ──────────────────
  type Skill @key(fields: "id") {
    id: ID!
    name: String!
    slug: String!
    category: String
    isActive: Boolean!
  }

  type Exam @key(fields: "id") {
    id: ID!
    skillId: ID!
    skillName: String!
    level: String!
    title: String!
    description: String
    passThreshold: Int!
    durationMinutes: Int!
    maxAttempts: Int!
    questionCount: Int!
    totalPoints: Int!
    status: String!
    version: Int!
    createdAt: String!
    publishedAt: String
    questions: [ExamQuestion!]!
  }

  # Admin-facing question (includes answers — never exposed to talents).
  type ExamQuestion {
    id: ID!
    examId: ID!
    type: String!
    prompt: String!
    imageUrl: String
    codeSnippet: String
    codeLanguage: String
    options: [QuestionOption!]
    correctOptionIds: [String!]
    modelAnswer: String
    gradingRubric: String
    expectedLanguage: String
    explanation: String
    points: Int!
    position: Int!
    aiGenerated: Boolean!
  }

  type QuestionOption {
    id: String!
    text: String!
    imageUrl: String
  }

  input CreateExamInput {
    skillId: ID!
    level: String!
    title: String!
    description: String
    passThreshold: Int
    durationMinutes: Int
    maxAttempts: Int
  }

  input UpdateExamInput {
    title: String
    description: String
    passThreshold: Int
    durationMinutes: Int
    maxAttempts: Int
  }

  input QuestionInput {
    type: String!
    prompt: String!
    imageUrl: String
    codeSnippet: String
    codeLanguage: String
    options: [QuestionOptionInput!]
    correctOptionIds: [String!]
    modelAnswer: String
    gradingRubric: String
    expectedLanguage: String
    explanation: String
    points: Int
  }

  input QuestionOptionInput {
    id: String!
    text: String!
    imageUrl: String
  }
`);
