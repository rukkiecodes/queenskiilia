import type { SkillLevel } from '~/types/filters'

export interface SkillCategory {
  id: string
  name: string
  parentCategory: string | null
  skills: string[]
}

export interface Question {
  index: number
  text: string
  options: string[]
}

export type SessionStatus = 'in_progress' | 'completed' | 'expired'

export interface AssessmentSession {
  id: string
  studentId: string
  category: string
  questions: Question[]
  status: SessionStatus
  startedAt: string
  expiresAt: string
}

export interface SkillAssessment {
  id: string
  studentId: string
  category: string
  level: SkillLevel
  score: number | null
  completedAt: string
}

export interface AnswerInput {
  questionIndex: number
  selectedOption: number
}
