import { userQueries, userMutations, userReference, userTypeResolvers } from './user';
import { adminQueries, adminMutations } from './admin';

export const resolvers = {
  Query:    { ...userQueries, ...adminQueries },
  Mutation: { ...userMutations, ...adminMutations },

  User: {
    __resolveReference: userReference.__resolveReference,
    studentProfile:     userTypeResolvers.studentProfile,
    businessProfile:    userTypeResolvers.businessProfile,
    verifications:      userTypeResolvers.verifications,
  },
};
