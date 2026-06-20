import { gqlFetch } from '~/lib/graphql-client'
import type { InitializePaymentInput, PaymentInit, PaymentVerification } from '~/types/payment'

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

export const paystackApi = {
  initialize: (input: InitializePaymentInput) =>
    gqlFetch<{ initializePayment: PaymentInit }>(INITIALIZE_PAYMENT, { input }).then(
      (r) => r.initializePayment,
    ),

  verify: (reference: string) =>
    gqlFetch<{ verifyPayment: PaymentVerification | null }>(VERIFY_PAYMENT, { reference }).then(
      (r) => r.verifyPayment,
    ),
}
