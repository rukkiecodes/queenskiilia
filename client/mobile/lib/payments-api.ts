import { gqlFetch } from './graphql-client';

export type EscrowStatus = 'held' | 'released' | 'refunded';

export type EscrowAccount = {
  id: string;
  projectId: string;
  businessId: string;
  studentId: string;
  amount: number;
  currency: string;
  gateway: string;
  gatewayRef: string | null;
  status: EscrowStatus;
  platformFee: number | null;
  createdAt: string;
  releasedAt: string | null;
};

export type PaymentTransaction = {
  id: string;
  userId: string;
  escrowId: string;
  type: string; // 'deposit' | 'release' | 'refund'
  amount: number;
  currency: string;
  gatewayRef: string | null;
  createdAt: string;
};

const ESCROW_FRAGMENT = `
  id
  projectId
  businessId
  studentId
  amount
  currency
  gateway
  gatewayRef
  status
  platformFee
  createdAt
  releasedAt
`;

const MY_ESCROWS = `query MyEscrows { myEscrows { ${ESCROW_FRAGMENT} } }`;

const GET_ESCROW = `
  query Escrow($projectId: ID!) {
    escrow(projectId: $projectId) { ${ESCROW_FRAGMENT} }
  }
`;

const INITIATE_ESCROW = `
  mutation InitiateEscrow($input: InitiateEscrowInput!) {
    initiateEscrow(input: $input) { ${ESCROW_FRAGMENT} }
  }
`;

const RELEASE_FUNDS = `
  mutation ReleaseFunds($projectId: ID!) {
    releaseFunds(projectId: $projectId) { ${ESCROW_FRAGMENT} }
  }
`;

const REFUND_ESCROW = `
  mutation RefundEscrow($projectId: ID!) {
    refundEscrow(projectId: $projectId) { ${ESCROW_FRAGMENT} }
  }
`;

const TRANSACTIONS = `
  query Transactions($escrowId: ID!) {
    transactions(escrowId: $escrowId) {
      id
      userId
      escrowId
      type
      amount
      currency
      gatewayRef
      createdAt
    }
  }
`;

export type InitiateEscrowInput = {
  projectId: string;
  studentId: string;
  amount: number;
  currency?: string;
  gateway?: string;
  gatewayRef?: string;
};

export const paymentsApi = {
  myEscrows: () =>
    gqlFetch<{ myEscrows: EscrowAccount[] }>(MY_ESCROWS).then(
      (r) => r.myEscrows,
    ),

  forProject: (projectId: string) =>
    gqlFetch<{ escrow: EscrowAccount | null }>(GET_ESCROW, { projectId }).then(
      (r) => r.escrow,
    ),

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
    gqlFetch<{ transactions: PaymentTransaction[] }>(TRANSACTIONS, {
      escrowId,
    }).then((r) => r.transactions),
};
