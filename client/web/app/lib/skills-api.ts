import { gqlFetch } from '~/lib/graphql-client'
import type { SkillLevel } from '~/types/filters'
import type { AnswerInput, AssessmentSession, SkillAssessment, SkillCategory } from '~/types/skills'

// Ported from client/mobile/lib/skills-api.ts.
const SESSION_FIELDS = `
  id studentId category status startedAt expiresAt
  questions { index text options }
`
const ASSESSMENT_FIELDS = `id studentId category level score completedAt`

const SKILL_CATEGORIES = `query SkillCategories { skillCategories { id name parentCategory skills } }`
const MY_ASSESSMENTS = `query MyAssessments { myAssessments { ${ASSESSMENT_FIELDS} } }`
const GET_ASSESSMENT = `query GetAssessment($id: ID!) { assessment(id: $id) { ${ASSESSMENT_FIELDS} } }`
const ACTIVE_SESSION = `query ActiveAssessmentSession { activeAssessmentSession { ${SESSION_FIELDS} } }`
const START_ASSESSMENT = `mutation StartAssessment($category: String!, $level: String!) { startAssessment(category: $category, level: $level) { ${SESSION_FIELDS} } }`
const SUBMIT_ASSESSMENT = `mutation SubmitAssessment($sessionId: ID!, $answers: [AnswerInput!]!) { submitAssessment(sessionId: $sessionId, answers: $answers) { ${ASSESSMENT_FIELDS} } }`

export const skillsApi = {
  categories: () =>
    gqlFetch<{ skillCategories: SkillCategory[] }>(SKILL_CATEGORIES).then((r) => r.skillCategories),

  myAssessments: () =>
    gqlFetch<{ myAssessments: SkillAssessment[] }>(MY_ASSESSMENTS).then((r) => r.myAssessments),

  assessment: (id: string) =>
    gqlFetch<{ assessment: SkillAssessment | null }>(GET_ASSESSMENT, { id }).then((r) => r.assessment),

  activeSession: () =>
    gqlFetch<{ activeAssessmentSession: AssessmentSession | null }>(ACTIVE_SESSION).then(
      (r) => r.activeAssessmentSession,
    ),

  start: (category: string, level: SkillLevel) =>
    gqlFetch<{ startAssessment: AssessmentSession }>(START_ASSESSMENT, { category, level }).then(
      (r) => r.startAssessment,
    ),

  submit: (sessionId: string, answers: AnswerInput[]) =>
    gqlFetch<{ submitAssessment: SkillAssessment }>(SUBMIT_ASSESSMENT, { sessionId, answers }).then(
      (r) => r.submitAssessment,
    ),
}
