import {
  projectQueries,
  projectMutations,
  projectReference,
  applicationReference,
  submissionReference,
} from './project';

export const resolvers = {
  Query:    projectQueries,
  Mutation: projectMutations,

  Project: {
    __resolveReference: projectReference.__resolveReference,
  },

  Application: {
    __resolveReference: applicationReference.__resolveReference,
  },

  Submission: {
    __resolveReference: submissionReference.__resolveReference,
  },
};
