import { gqlFetch } from '~/lib/graphql-client'
import type {
  Bank,
  InitializePaymentInput,
  PayoutAccount,
  PaymentInit,
  PaymentVerification,
  ResolvedAccount,
  SetupPayoutInput,
} from '~/types/payment'

const INITIALIZE_PAYMENT = `
  mutation InitializePayment($input: InitializePaymentInput!) {
    initializePayment(input: $input) { authorizationUrl accessCode reference }
  }
`
const VERIFY_PAYMENT = `
  query VerifyPayment($reference: String!) {
    verifyPayment(reference: $reference) { reference status amount currency paidAt gatewayResponse }
  }
`
const PAYSTACK_BANKS = `query PaystackBanks { paystackBanks { name code slug } }`
const RESOLVE_ACCOUNT = `
  query ResolveAccountNumber($accountNumber: String!, $bankCode: String!) {
    resolveAccountNumber(accountNumber: $accountNumber, bankCode: $bankCode) { accountNumber accountName }
  }
`
const PAYOUT_FRAGMENT = `bankCode accountNumber accountName subaccountCode isComplete`
const MY_PAYOUT_ACCOUNT = `query MyPayoutAccount { myPayoutAccount { ${PAYOUT_FRAGMENT} } }`
const SETUP_PAYOUT = `
  mutation SetupTalentPayout($input: SetupPayoutInput!) {
    setupTalentPayout(input: $input) { ${PAYOUT_FRAGMENT} }
  }
`

export const paystackApi = {
  initialize: (input: InitializePaymentInput) =>
    gqlFetch<{ initializePayment: PaymentInit }>(INITIALIZE_PAYMENT, { input }).then(
      (r) => r.initializePayment,
    ),

  verify: (reference: string) =>
    gqlFetch<{ verifyPayment: PaymentVerification | null }>(VERIFY_PAYMENT, { reference }).then(
      (r) => r.verifyPayment,
    ),

  banks: () => gqlFetch<{ paystackBanks: Bank[] }>(PAYSTACK_BANKS).then((r) => r.paystackBanks),

  resolveAccount: (accountNumber: string, bankCode: string) =>
    gqlFetch<{ resolveAccountNumber: ResolvedAccount }>(RESOLVE_ACCOUNT, {
      accountNumber,
      bankCode,
    }).then((r) => r.resolveAccountNumber),

  myPayoutAccount: () =>
    gqlFetch<{ myPayoutAccount: PayoutAccount | null }>(MY_PAYOUT_ACCOUNT).then(
      (r) => r.myPayoutAccount,
    ),

  setupPayout: (input: SetupPayoutInput) =>
    gqlFetch<{ setupTalentPayout: PayoutAccount }>(SETUP_PAYOUT, { input }).then(
      (r) => r.setupTalentPayout,
    ),
}
