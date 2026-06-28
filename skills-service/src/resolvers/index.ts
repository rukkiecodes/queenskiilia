import {
  skillQueries,
  skillMutations,
  skillCategoryReference,
  skillAssessmentReference,
  assessmentSessionReference,
} from './skills';
import { examQueries, examMutations, examTypeResolvers } from './exam-admin';
import { takingQueries, takingMutations } from './exam-taking';

export const resolvers = {
  Query:    { ...skillQueries, ...examQueries, ...takingQueries },
  Mutation: { ...skillMutations, ...examMutations, ...takingMutations },

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
