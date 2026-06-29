import { adminGqlFetch } from '~/lib/admin-api'

// Admin exam-authoring operations (Phase 2). All admin-gated server-side.

export interface Skill {
  id: string
  name: string
  slug: string
  category?: string | null
  isActive: boolean
}

export interface QuestionOption {
  id: string
  text: string
  imageUrl?: string | null
}

export type QuestionType = 'single' | 'multiple' | 'boolean' | 'short_answer' | 'code'

export interface ExamQuestion {
  id: string
  examId: string
  type: QuestionType
  prompt: string
  imageUrl?: string | null
  codeSnippet?: string | null
  codeLanguage?: string | null
  options?: QuestionOption[] | null
  correctOptionIds?: string[] | null
  modelAnswer?: string | null
  gradingRubric?: string | null
  expectedLanguage?: string | null
  explanation?: string | null
  points: number
  position: number
  aiGenerated: boolean
}

export interface Exam {
  id: string
  skillId: string
  skillName: string
  level: string
  title: string
  description?: string | null
  passThreshold: number
  durationMinutes: number
  maxAttempts: number
  questionCount: number
  totalPoints: number
  status: string
  version: number
  createdAt: string
  publishedAt?: string | null
  questions?: ExamQuestion[]
}

const EXAM_FIELDS = `
  id skillId skillName level title description passThreshold durationMinutes
  maxAttempts questionCount totalPoints status version createdAt publishedAt
`
const QUESTION_FIELDS = `
  id examId type prompt imageUrl codeSnippet codeLanguage
  options { id text imageUrl } correctOptionIds
  modelAnswer gradingRubric expectedLanguage explanation points position aiGenerated
`

export const fetchAdminSkills = () =>
  adminGqlFetch<{ adminSkills: Skill[] }>(`query { adminSkills { id name slug category isActive } }`).then(
    (r) => r.adminSkills,
  )

export const fetchAdminExams = (skillId?: string, level?: string, status?: string) =>
  adminGqlFetch<{ adminExams: Exam[] }>(
    `query($skillId: ID, $level: String, $status: String) {
      adminExams(skillId: $skillId, level: $level, status: $status) { ${EXAM_FIELDS} }
    }`,
    { skillId, level, status },
  ).then((r) => r.adminExams)

export const fetchAdminExam = (id: string) =>
  adminGqlFetch<{ adminExam: Exam | null }>(
    `query($id: ID!) { adminExam(id: $id) { ${EXAM_FIELDS} questions { ${QUESTION_FIELDS} } } }`,
    { id },
  ).then((r) => r.adminExam)

export const createSkill = (name: string, category?: string) =>
  adminGqlFetch<{ createSkill: Skill }>(
    `mutation($name: String!, $category: String) { createSkill(name: $name, category: $category) { id name slug category isActive } }`,
    { name, category },
  ).then((r) => r.createSkill)

export interface CreateExamInput {
  skillId: string
  level: string
  title: string
  description?: string
  passThreshold?: number
  durationMinutes?: number
  maxAttempts?: number
}

export const createExam = (input: CreateExamInput) =>
  adminGqlFetch<{ createExam: Exam }>(
    `mutation($input: CreateExamInput!) { createExam(input: $input) { ${EXAM_FIELDS} } }`,
    { input },
  ).then((r) => r.createExam)

export const updateExam = (id: string, input: Partial<CreateExamInput>) =>
  adminGqlFetch<{ updateExam: Exam }>(
    `mutation($id: ID!, $input: UpdateExamInput!) { updateExam(id: $id, input: $input) { ${EXAM_FIELDS} } }`,
    { id, input },
  ).then((r) => r.updateExam)

export const generateExamQuestions = (examId: string, count: number, types?: string[]) =>
  adminGqlFetch<{ generateExamQuestions: ExamQuestion[] }>(
    `mutation($examId: ID!, $count: Int!, $types: [String!]) {
      generateExamQuestions(examId: $examId, count: $count, types: $types) { ${QUESTION_FIELDS} }
    }`,
    { examId, count, types },
  ).then((r) => r.generateExamQuestions)

export const fixExamAnswers = (examId: string) =>
  adminGqlFetch<{ fixExamAnswers: Exam }>(
    `mutation($examId: ID!) { fixExamAnswers(examId: $examId) { ${EXAM_FIELDS} } }`,
    { examId },
  ).then((r) => r.fixExamAnswers)

export interface QuestionInput {
  type: string
  prompt: string
  imageUrl?: string | null
  codeSnippet?: string | null
  codeLanguage?: string | null
  options?: { id: string; text: string; imageUrl?: string | null }[] | null
  correctOptionIds?: string[] | null
  modelAnswer?: string | null
  gradingRubric?: string | null
  expectedLanguage?: string | null
  explanation?: string | null
  points?: number
}

export const addQuestion = (examId: string, input: QuestionInput) =>
  adminGqlFetch<{ addQuestion: ExamQuestion }>(
    `mutation($examId: ID!, $input: QuestionInput!) { addQuestion(examId: $examId, input: $input) { ${QUESTION_FIELDS} } }`,
    { examId, input },
  ).then((r) => r.addQuestion)

export const updateQuestion = (id: string, input: QuestionInput) =>
  adminGqlFetch<{ updateQuestion: ExamQuestion }>(
    `mutation($id: ID!, $input: QuestionInput!) { updateQuestion(id: $id, input: $input) { ${QUESTION_FIELDS} } }`,
    { id, input },
  ).then((r) => r.updateQuestion)

export const deleteQuestion = (id: string) =>
  adminGqlFetch<{ deleteQuestion: boolean }>(
    `mutation($id: ID!) { deleteQuestion(id: $id) }`,
    { id },
  ).then((r) => r.deleteQuestion)

export const reorderQuestions = (examId: string, questionIds: string[]) =>
  adminGqlFetch<{ reorderQuestions: boolean }>(
    `mutation($examId: ID!, $questionIds: [ID!]!) { reorderQuestions(examId: $examId, questionIds: $questionIds) }`,
    { examId, questionIds },
  ).then((r) => r.reorderQuestions)

export const publishExam = (id: string) =>
  adminGqlFetch<{ publishExam: Exam }>(
    `mutation($id: ID!) { publishExam(id: $id) { ${EXAM_FIELDS} } }`,
    { id },
  ).then((r) => r.publishExam)

export const archiveExam = (id: string) =>
  adminGqlFetch<{ archiveExam: Exam }>(
    `mutation($id: ID!) { archiveExam(id: $id) { ${EXAM_FIELDS} } }`,
    { id },
  ).then((r) => r.archiveExam)
