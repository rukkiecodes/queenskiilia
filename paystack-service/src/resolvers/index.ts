import { GraphQLError } from 'graphql';
import { paystackClient } from '../paystack';
import { db } from '../shared/db';
import { env } from '../config/env';

function requireAuth(ctx: any): string {
  if (!ctx.userId) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
  return ctx.userId;
}

function requireStudent(ctx: any): string {
  const userId = requireAuth(ctx);
  if (ctx.accountType !== 'student') {
    throw new GraphQLError('Only talents can set up payouts', { extensions: { code: 'FORBIDDEN' } });
  }
  return userId;
}

function mapPayout(row: any) {
  return {
    bankCode:       row?.bank_code ?? null,
    accountNumber:  row?.account_number ?? null,
    accountName:    row?.account_name ?? null,
    subaccountCode: row?.paystack_subaccount_code ?? null,
    isComplete:     !!row?.paystack_subaccount_code,
  };
}

function paystackMessage(err: any, fallback: string): string {
  return err?.response?.data?.message ?? err?.message ?? fallback;
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

    // Verify a talent's bank account resolves to a real holder (for the
    // payout-setup form, before creating the subaccount).
    async resolveAccountNumber(_: any, { accountNumber, bankCode }: any, ctx: any) {
      requireAuth(ctx);
      try {
        return await paystackClient.resolveAccountNumber({ accountNumber, bankCode });
      } catch (err: any) {
        throw new GraphQLError('Could not resolve account: ' + paystackMessage(err, 'invalid account'), {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
    },

    // The signed-in talent's saved payout details (null fields until set up).
    async myPayoutAccount(_: any, __: any, ctx: any) {
      const userId = requireAuth(ctx);
      const res = await db.query(
        `SELECT bank_code, account_number, account_name, paystack_subaccount_code
           FROM student_profiles WHERE user_id = $1`,
        [userId]
      );
      return mapPayout(res.rowCount ? res.rows[0] : null);
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

    // Talent payout setup: verify the bank account, create a Paystack subaccount
    // (platform keeps PLATFORM_FEE_PERCENT; settlement schedule from env — manual
    // by default so the talent's split is held until release), and persist it on
    // the student's profile. Idempotent-ish: re-running updates the stored details
    // and creates a fresh subaccount.
    async setupTalentPayout(_: any, { input }: any, ctx: any) {
      const userId = requireStudent(ctx);
      const { bankCode, accountNumber } = input;

      // 1. Confirm the account is real and get the holder name.
      let accountName: string;
      try {
        const resolved = await paystackClient.resolveAccountNumber({ accountNumber, bankCode });
        accountName = resolved.accountName;
      } catch (err: any) {
        throw new GraphQLError('Bank account could not be verified: ' + paystackMessage(err, 'invalid account'), {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // 2. Create the subaccount on Paystack.
      let subaccountCode: string;
      try {
        const sub = await paystackClient.createSubaccount({
          businessName:       accountName,
          bankCode,
          accountNumber,
          percentageCharge:   env.PLATFORM_FEE_PERCENT,
          settlementSchedule: env.SUBACCOUNT_SETTLEMENT_SCHEDULE,
          description:        `QueenSkiilia talent payout (${userId})`,
        });
        subaccountCode = sub.subaccountCode;
      } catch (err: any) {
        throw new GraphQLError('Could not create payout account: ' + paystackMessage(err, 'subaccount error'));
      }

      // 3. Persist on the talent's profile.
      const res = await db.query(
        `UPDATE student_profiles
            SET bank_code = $2, account_number = $3, account_name = $4,
                paystack_subaccount_code = $5, updated_at = NOW()
          WHERE user_id = $1
          RETURNING bank_code, account_number, account_name, paystack_subaccount_code`,
        [userId, bankCode, accountNumber, accountName, subaccountCode]
      );
      if (!res.rowCount) {
        throw new GraphQLError('Student profile not found', { extensions: { code: 'NOT_FOUND' } });
      }
      return mapPayout(res.rows[0]);
    },
  },
};
