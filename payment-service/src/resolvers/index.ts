import {
  paymentQueries,
  paymentMutations,
  escrowReference,
  milestoneReference,
  transactionReference,
} from './payment';

export const resolvers = {
  Query:    paymentQueries,
  Mutation: paymentMutations,

  EscrowAccount: {
    __resolveReference: escrowReference.__resolveReference,
  },

  Milestone: {
    __resolveReference: milestoneReference.__resolveReference,
  },

  PaymentTransaction: {
    __resolveReference: transactionReference.__resolveReference,
  },
};
