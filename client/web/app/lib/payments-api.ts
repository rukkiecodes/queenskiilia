import { gqlFetch } from '~/lib/graphql-client'
import type { EscrowAccount, InitiateEscrowInput, PaymentTransaction } from '~/types/payment'

const ESCROW_FRAGMENT = `
  id projectId businessId studentId amount currency gateway gatewayRef
  status platformFee createdAt releasedAt
`

const MY_ESCROWS = `query MyEscrows { myEscrows { ${ESCROW_FRAGMENT} } }`
const GET_ESCROW = `query Escrow($projectId: ID!) { escrow(projectId: $projectId) { ${ESCROW_FRAGMENT} } }`
const INITIATE_ESCROW = `mutation InitiateEscrow($input: InitiateEscrowInput!) { initiateEscrow(input: $input) { ${ESCROW_FRAGMENT} } }`
const RELEASE_FUNDS = `mutation ReleaseFunds($projectId: ID!) { releaseFunds(projectId: $projectId) { ${ESCROW_FRAGMENT} } }`
const REFUND_ESCROW = `mutation RefundEscrow($projectId: ID!) { refundEscrow(projectId: $projectId) { ${ESCROW_FRAGMENT} } }`
const TRANSACTIONS = `query Transactions($escrowId: ID!) { transactions(escrowId: $escrowId) { id userId escrowId type amount currency gatewayRef createdAt } }`

export const paymentsApi = {
  myEscrows: () => gqlFetch<{ myEscrows: EscrowAccount[] }>(MY_ESCROWS).then((r) => r.myEscrows),

  forProject: (projectId: string) =>
    gqlFetch<{ escrow: EscrowAccount | null }>(GET_ESCROW, { projectId }).then((r) => r.escrow),

  initiate: (input: InitiateEscrowInput) =>
    gqlFetch<{ initiateEscrow: EscrowAccount }>(INITIATE_ESCROW, { input }).then(
      (r) => r.initiateEscrow,
    ),

  release: (projectId: string) =>
    gqlFetch<{ releaseFunds: EscrowAccount }>(RELEASE_FUNDS, { projectId }).then(
      (r) => r.releaseFunds,
    ),

  refund: (projectId: string) =>
    gqlFetch<{ refundEscrow: EscrowAccount }>(REFUND_ESCROW, { projectId }).then(
      (r) => r.refundEscrow,
    ),

  transactions: (escrowId: string) =>
    gqlFetch<{ transactions: PaymentTransaction[] }>(TRANSACTIONS, { escrowId }).then(
      (r) => r.transactions,
    ),
}
