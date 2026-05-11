import { gqlFetch } from './graphql-client';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type SkillCategory = {
  id: string;
  name: string;
  parentCategory: string | null;
  skills: string[];
};

export type Question = {
  index: number;
  text: string;
  options: string[];
};

export type AssessmentSession = {
  id: string;
  studentId: string;
  category: string;
  questions: Question[];
  status: 'in_progress' | 'completed' | 'expired';
  startedAt: string;
  expiresAt: string;
};

export type SkillAssessment = {
  id: string;
  studentId: string;
  category: string;
  level: SkillLevel;
  score: number | null;
  completedAt: string;
};

export type AnswerInput = {
  questionIndex: number;
  selectedOption: number;
};

const SKILL_CATEGORIES = `
  query SkillCategories {
    skillCategories {
      id
      name
      parentCategory
      skills
    }
  }
`;

const MY_ASSESSMENTS = `
  query MyAssessments {
    myAssessments {
      id
      studentId
      category
      level
      score
      completedAt
    }
  }
`;

const GET_ASSESSMENT = `
  query GetAssessment($id: ID!) {
    assessment(id: $id) {
      id
      studentId
      category
      level
      score
      completedAt
    }
  }
`;

const ACTIVE_SESSION = `
  query ActiveAssessmentSession {
    activeAssessmentSession {
      id
      studentId
      category
      status
      startedAt
      expiresAt
      questions { index text options }
    }
  }
`;

const START_ASSESSMENT = `
  mutation StartAssessment($category: String!, $level: String!) {
    startAssessment(category: $category, level: $level) {
      id
      studentId
      category
      status
      startedAt
      expiresAt
      questions { index text options }
    }
  }
`;

const SUBMIT_ASSESSMENT = `
  mutation SubmitAssessment($sessionId: ID!, $answers: [AnswerInput!]!) {
    submitAssessment(sessionId: $sessionId, answers: $answers) {
      id
      studentId
      category
      level
      score
      completedAt
    }
  }
`;

export const skillsApi = {
  categories: () =>
    gqlFetch<{ skillCategories: SkillCategory[] }>(SKILL_CATEGORIES).then(
      (r) => r.skillCategories,
    ),

  myAssessments: () =>
    gqlFetch<{ myAssessments: SkillAssessment[] }>(MY_ASSESSMENTS).then(
      (r) => r.myAssessments,
    ),

  assessment: (id: string) =>
    gqlFetch<{ assessment: SkillAssessment | null }>(GET_ASSESSMENT, { id }).then(
      (r) => r.assessment,
    ),

  activeSession: () =>
    gqlFetch<{ activeAssessmentSession: AssessmentSession | null }>(
      ACTIVE_SESSION,
    ).then((r) => r.activeAssessmentSession),

  start: (category: string, level: SkillLevel) =>
    gqlFetch<{ startAssessment: AssessmentSession }>(START_ASSESSMENT, {
      category,
      level,
    }).then((r) => r.startAssessment),

  submit: (sessionId: string, answers: AnswerInput[]) =>
    gqlFetch<{ submitAssessment: SkillAssessment }>(SUBMIT_ASSESSMENT, {
      sessionId,
      answers,
    }).then((r) => r.submitAssessment),
};
