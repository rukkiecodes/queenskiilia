import { parse } from 'graphql';

export const typeDefs = parse(`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable", "@external", "@requires"])

  type Query {
    paystackBanks: [Bank!]!
    verifyPayment(reference: String!): PaymentVerification
    resolveAccountNumber(accountNumber: String!, bankCode: String!): ResolvedAccount!
    myPayoutAccount: PayoutAccount
  }

  type Mutation {
    initializePayment(input: InitializePaymentInput!): PaymentInit!
    createTransferRecipient(input: CreateRecipientInput!): RecipientResult!
    initiateTransfer(input: InitiateTransferInput!): TransferResult!
    setupTalentPayout(input: SetupPayoutInput!): PayoutAccount!
  }

  type PaymentInit {
    authorizationUrl: String!
    accessCode:       String!
    reference:        String!
  }

  type PaymentVerification {
    reference:       String!
    status:          String!
    amount:          Float!
    currency:        String!
    paidAt:          String
    gatewayResponse: String!
  }

  type RecipientResult {
    recipientCode: String!
  }

  type TransferResult {
    transferCode: String!
    reference:    String!
    status:       String!
  }

  type Bank {
    name: String!
    code: String!
    slug: String!
  }

  "Result of resolving a bank account number to its holder name (verification)."
  type ResolvedAccount {
    accountNumber: String!
    accountName:   String!
  }

  "A talent's saved payout details + Paystack subaccount."
  type PayoutAccount {
    bankCode:       String
    accountNumber:  String
    accountName:    String
    subaccountCode: String
    "True once a Paystack subaccount has been created for the talent."
    isComplete:     Boolean!
  }

  input InitializePaymentInput {
    email:       String!
    amountKobo:  Int!
    reference:   String!
    callbackUrl: String
  }

  input CreateRecipientInput {
    name:          String!
    accountNumber: String!
    bankCode:      String!
  }

  input InitiateTransferInput {
    amountKobo:    Int!
    recipientCode: String!
    reference:     String!
    reason:        String
  }

  input SetupPayoutInput {
    bankCode:      String!
    accountNumber: String!
  }
`);
