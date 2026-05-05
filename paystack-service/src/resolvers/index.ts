import { GraphQLError } from 'graphql';
import { paystackClient } from '../paystack';

function requireAuth(ctx: any): string {
  if (!ctx.userId) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
  return ctx.userId;
}

export const resolvers = {
  Query: {
    async paystackBanks(_: any, __: any, _ctx: any) {
      try {
        const banks = await paystackClient.listBanks();
        return banks;
      } catch (err: any) {
        throw new GraphQLError('Failed to fetch banks: ' + err.message);
      }
    },

    async verifyPayment(_: any, { reference }: any, _ctx: any) {
      try {
        const result = await paystackClient.verifyTransaction(reference);
        return {
          reference:       result.reference,
          status:          result.status,
          amount:          result.amount / 100, // kobo → naira
          currency:        result.currency,
          paidAt:          result.paidAt,
          gatewayResponse: result.gateway_response,
        };
      } catch (err: any) {
        throw new GraphQLError('Verification failed: ' + err.message);
      }
    },
  },

  Mutation: {
    async initializePayment(_: any, { input }: any, ctx: any) {
      requireAuth(ctx);
      try {
        const result = await paystackClient.initializeTransaction({
          email:        input.email,
          amount:       input.amountKobo,
          reference:    input.reference,
          callback_url: input.callbackUrl,
        });
        return {
          authorizationUrl: result.authorization_url,
          accessCode:       result.access_code,
          reference:        result.reference,
        };
      } catch (err: any) {
        throw new GraphQLError('Payment initialization failed: ' + err.message);
      }
    },

    async createTransferRecipient(_: any, { input }: any, ctx: any) {
      requireAuth(ctx);
      try {
        const result = await paystackClient.createTransferRecipient({
          name:          input.name,
          accountNumber: input.accountNumber,
          bankCode:      input.bankCode,
        });
        return result;
      } catch (err: any) {
        throw new GraphQLError('Failed to create recipient: ' + err.message);
      }
    },

    async initiateTransfer(_: any, { input }: any, ctx: any) {
      requireAuth(ctx);
      try {
        const result = await paystackClient.initiateTransfer({
          amount:        input.amountKobo,
          recipientCode: input.recipientCode,
          reference:     input.reference,
          reason:        input.reason,
        });
        return result;
      } catch (err: any) {
        throw new GraphQLError('Transfer failed: ' + err.message);
      }
    },
  },
};
