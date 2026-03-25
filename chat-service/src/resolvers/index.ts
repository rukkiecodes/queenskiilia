import { chatResolvers } from './chat';

export const resolvers = {
  Query: {
    ...chatResolvers.Query,
  },
  Mutation: {
    ...chatResolvers.Mutation,
  },
  Chat: {
    __resolveReference: chatResolvers.Chat.__resolveReference,
  },
  Message: {
    __resolveReference: chatResolvers.Message.__resolveReference,
  },
};
