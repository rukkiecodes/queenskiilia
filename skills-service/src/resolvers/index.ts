import {
  skillQueries,
  skillMutations,
  skillCategoryReference,
  skillAssessmentReference,
  assessmentSessionReference,
} from './skills';

export const resolvers = {
  Query:    skillQueries,
  Mutation: skillMutations,

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
