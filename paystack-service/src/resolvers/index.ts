import { GraphQLError } from 'graphql';
import { paystackClient } from '../paystack';
import { emitTelemetry } from '../telemetry';

function requireAuth(ctx: any): string {
  if (!ctx.userId) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
  return ctx.userId;
}

export const resolvers = {
  Query: {
    async paystackBanks(_: any, __: any, ctx: any) {
      const start = Date.now();
      try {
        const banks = await paystackClient.listBanks();
        emitTelemetry({ operationType: 'query', operationName: 'paystackBanks', userId: ctx.userId, durationMs: Date.now() - start, status: 'success' });
        return banks;
      } catch (err: any) {
        emitTelemetry({ operationType: 'query', operationName: 'paystackBanks', userId: ctx.userId, durationMs: Date.now() - start, status: 'error', errorMessage: err.message });
        throw new GraphQLError('Failed to fetch banks: ' + err.message);
      }
    },

    async verifyPayment(_: any, { reference }: any, ctx: any) {
      const start = Date.now();
      try {
        const result = await paystackClient.verifyTransaction(reference);
        emitTelemetry({ operationType: 'query', operationName: 'verifyPayment', userId: ctx.userId, durationMs: Date.now() - start, status: 'success' });
        return {
          reference:       result.reference,
          status:          result.status,
          amount:          result.amount / 100, // kobo → naira
          currency:        result.currency,
          paidAt:          result.paidAt,
          gatewayResponse: result.gateway_response,
        };
      } catch (err: any) {
        emitTelemetry({ operationType: 'query', operationName: 'verifyPayment', userId: ctx.userId, durationMs: Date.now() - start, status: 'error', errorMessage: err.message });
        throw new GraphQLError('Verification failed: ' + err.message);
      }
    },
  },

  Mutation: {
    async initializePayment(_: any, { input }: any, ctx: any) {
      const start  = Date.now();
      const userId = requireAuth(ctx);
      try {
        const result = await paystackClient.initializeTransaction({
          email:        input.email,
          amount:       input.amountKobo,
          reference:    input.reference,
          callback_url: input.callbackUrl,
        });
        emitTelemetry({ operationType: 'mutation', operationName: 'initializePayment', userId, durationMs: Date.now() - start, status: 'success' });
        return {
          authorizationUrl: result.authorization_url,
          accessCode:       result.access_code,
          reference:        result.reference,
        };
      } catch (err: any) {
        emitTelemetry({ operationType: 'mutation', operationName: 'initializePayment', userId, durationMs: Date.now() - start, status: 'error', errorMessage: err.message });
        throw new GraphQLError('Payment initialization failed: ' + err.message);
      }
    },

    async createTransferRecipient(_: any, { input }: any, ctx: any) {
      const start  = Date.now();
      const userId = requireAuth(ctx);
      try {
        const result = await paystackClient.createTransferRecipient({
          name:          input.name,
          accountNumber: input.accountNumber,
          bankCode:      input.bankCode,
        });
        emitTelemetry({ operationType: 'mutation', operationName: 'createTransferRecipient', userId, durationMs: Date.now() - start, status: 'success' });
        return result;
      } catch (err: any) {
        emitTelemetry({ operationType: 'mutation', operationName: 'createTransferRecipient', userId, durationMs: Date.now() - start, status: 'error', errorMessage: err.message });
        throw new GraphQLError('Failed to create recipient: ' + err.message);
      }
    },

    async initiateTransfer(_: any, { input }: any, ctx: any) {
      const start  = Date.now();
      const userId = requireAuth(ctx);
      try {
        const result = await paystackClient.initiateTransfer({
          amount:        input.amountKobo,
          recipientCode: input.recipientCode,
          reference:     input.reference,
          reason:        input.reason,
        });
        emitTelemetry({ operationType: 'mutation', operationName: 'initiateTransfer', userId, durationMs: Date.now() - start, status: 'success' });
        return result;
      } catch (err: any) {
        emitTelemetry({ operationType: 'mutation', operationName: 'initiateTransfer', userId, durationMs: Date.now() - start, status: 'error', errorMessage: err.message });
        throw new GraphQLError('Transfer failed: ' + err.message);
      }
    },
  },
};
