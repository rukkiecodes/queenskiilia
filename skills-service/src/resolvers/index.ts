import {
  skillQueries,
  skillMutations,
  skillCategoryReference,
  skillAssessmentReference,
  assessmentSessionReference,
} from './skills';
import { examQueries, examMutations, examTypeResolvers } from './exam-admin';

export const resolvers = {
  Query:    { ...skillQueries, ...examQueries },
  Mutation: { ...skillMutations, ...examMutations },

  Exam: {
    questions: examTypeResolvers.questions,
  },

  SkillCategory: {
    __resolveReference: skillCategoryReference.__resolveReference,
  },

  SkillAssessment: {
    __resolveReference: skillAssessmentReference.__resolveReference,
  },

  AssessmentSession: {
    __resolveReference: assessmentSessionReference.__resolveReference,
  },
};
