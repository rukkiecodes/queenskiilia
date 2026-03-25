import { userQueries, userMutations, userReference, userTypeResolvers } from './user';

export const resolvers = {
  Query:    userQueries,
  Mutation: userMutations,

  User: {
    __resolveReference: userReference.__resolveReference,
    studentProfile:     userTypeResolvers.studentProfile,
    businessProfile:    userTypeResolvers.businessProfile,
    verifications:      userTypeResolvers.verifications,
  },
};
