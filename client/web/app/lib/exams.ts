import { gqlFetch } from '~/lib/graphql-client'

// Talent-facing exam operations (uses the normal user token via gqlFetch).
// These never return correct answers until an attempt is graded.

export interface ExamSummary {
  id: string
  skillName: string
  level: string
  title: string
  description?: string | null
  passThreshold: number
  durationMinutes: number
  maxAttempts: number
  questionCount: number
  totalPoints: number
}

export interface TakingOption {
  id: string
  text: string
  imageUrl?: string | null
}

export interface TakingQuestion {
  id: string
  type: string
  prompt: string
  imageUrl?: string | null
  codeSnippet?: string | null
  codeLanguage?: string | null
  options?: TakingOption[] | null
  points: number
}

export interface SavedAnswer {
  questionId: string
  selectedOptionIds?: string[] | null
  textAnswer?: string | null
}

export interface AttemptInProgress {
  id: string
  examId: string
  examTitle: string
  expiresAt: string
  durationMinutes: number
  attemptNumber: number
  questions: TakingQuestion[]
  savedAnswers: SavedAnswer[]
}

export interface Attempt {
  id: string
  examId: string
  status: string
  scorePct?: number | null
  passed?: boolean | null
  grade?: string | null
  scorePoints?: number | null
  totalPoints?: number | null
  submittedAt?: string | null
  attemptNumber: number
}

export interface GradedAnswer {
  questionId: string
  type: string
  prompt: string
  options?: TakingOption[] | null
  selectedOptionIds?: string[] | null
  textAnswer?: string | null
  correctOptionIds?: string[] | null
  isCorrect: boolean
  awardedPoints: number
  points: number
  feedback?: string | null
  explanation?: string | null
}

export interface AttemptResult {
  id: string
  examId: string
  examTitle: string
  skillName: string
  level: string
  scorePct?: number | null
  passed?: boolean | null
  grade?: string | null
  scorePoints?: number | null
  totalPoints?: number | null
  submittedAt?: string | null
  certificateCode?: string | null
  answers: GradedAnswer[]
}

const SUMMARY = `
  id skillName level title description passThreshold durationMinutes maxAttempts questionCount totalPoints
`
const IN_PROGRESS = `
  id examId examTitle expiresAt durationMinutes attemptNumber
  questions { id type prompt imageUrl codeSnippet codeLanguage options { id text imageUrl } points }
  savedAnswers { questionId selectedOptionIds textAnswer }
`
const RESULT = `
  id examId examTitle skillName level scorePct passed grade scorePoints totalPoints submittedAt certificateCode
  answers { questionId type prompt options { id text imageUrl } selectedOptionIds textAnswer correctOptionIds isCorrect awardedPoints points feedback explanation }
`

export const fetchPublishedExams = (skillId?: string, level?: string) =>
  gqlFetch<{ publishedExams: ExamSummary[] }>(
    `query($skillId: ID, $level: String) { publishedExams(skillId: $skillId, level: $level) { ${SUMMARY} } }`,
    { skillId, level },
  ).then((r) => r.publishedExams)

export const fetchMyAttempts = (examId: string) =>
  gqlFetch<{ myExamAttempts: Attempt[] }>(
    `query($examId: ID!) { myExamAttempts(examId: $examId) { id examId status scorePct passed grade scorePoints totalPoints submittedAt attemptNumber } }`,
    { examId },
  ).then((r) => r.myExamAttempts)

export const fetchActiveAttempt = (examId: string) =>
  gqlFetch<{ activeAttempt: AttemptInProgress | null }>(
    `query($examId: ID!) { activeAttempt(examId: $examId) { ${IN_PROGRESS} } }`,
    { examId },
  ).then((r) => r.activeAttempt)

export const fetchAttemptResult = (attemptId: string) =>
  gqlFetch<{ attemptResult: AttemptResult | null }>(
    `query($attemptId: ID!) { attemptResult(attemptId: $attemptId) { ${RESULT} } }`,
    { attemptId },
  ).then((r) => r.attemptResult)

export const startAttempt = (examId: string) =>
  gqlFetch<{ startAttempt: AttemptInProgress }>(
    `mutation($examId: ID!) { startAttempt(examId: $examId) { ${IN_PROGRESS} } }`,
    { examId },
  ).then((r) => r.startAttempt)

export const saveAnswer = (
  attemptId: string,
  questionId: string,
  optionIds?: string[],
  textAnswer?: string,
) =>
  gqlFetch<{ saveAnswer: boolean }>(
    `mutation($attemptId: ID!, $questionId: ID!, $optionIds: [String!], $textAnswer: String) {
      saveAnswer(attemptId: $attemptId, questionId: $questionId, optionIds: $optionIds, textAnswer: $textAnswer)
    }`,
    { attemptId, questionId, optionIds, textAnswer },
  ).then((r) => r.saveAnswer)

export const submitAttempt = (attemptId: string) =>
  gqlFetch<{ submitAttempt: AttemptResult }>(
    `mutation($attemptId: ID!) { submitAttempt(attemptId: $attemptId) { ${RESULT} } }`,
    { attemptId },
  ).then((r) => r.submitAttempt)

export interface Certificate {
  id: string
  certificateCode: string
  skillName: string
  level: string
  scorePct?: number | null
  grade?: string | null
  talentName?: string | null
  issuedAt: string
  isRevoked: boolean
}

const CERT = `id certificateCode skillName level scorePct grade talentName issuedAt isRevoked`

// Public — no auth required (verification).
export const fetchCertificate = (code: string) =>
  gqlFetch<{ certificate: Certificate | null }>(
    `query($code: String!) { certificate(code: $code) { ${CERT} } }`,
    { code },
  ).then((r) => r.certificate)

export const fetchMyCertificates = () =>
  gqlFetch<{ myCertificates: Certificate[] }>(`query { myCertificates { ${CERT} } }`).then(
    (r) => r.myCertificates,
  )
