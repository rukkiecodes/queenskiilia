import { notificationQueries, notificationMutations, notificationReference } from './notification';

export const resolvers = {
  Query:    notificationQueries,
  Mutation: notificationMutations,

  Notification: {
    __resolveReference: notificationReference.__resolveReference,
  },
};
