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
    // Reference the employer; user-service resolves its fields via @key.
    business: (project: any) =>
      project.businessId ? { __typename: 'User', id: project.businessId } : null,
  },

  Application: {
    __resolveReference: applicationReference.__resolveReference,
  },

  Submission: {
    __resolveReference: submissionReference.__resolveReference,
  },
};
