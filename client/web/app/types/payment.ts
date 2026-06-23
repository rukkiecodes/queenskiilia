export type EscrowStatus = 'pending' | 'held' | 'released' | 'refunded' | 'disputed'

export interface EscrowAccount {
  id: string
  projectId: string
  businessId: string
  studentId: string
  amount: number
  currency: string
  gateway: string
  gatewayRef: string | null
  status: EscrowStatus
  platformFee: number | null
  createdAt: string
  releasedAt: string | null
}

export interface PaymentTransaction {
  id: string
  userId: string
  escrowId: string
  type: string
  amount: number
  currency: string
  gatewayRef: string | null
  createdAt: string
}

export interface InitiateEscrowInput {
  projectId: string
  studentId: string
  amount: number
  currency?: string
  gateway?: string
  gatewayRef?: string
}

export interface PaymentInit {
  authorizationUrl: string
  accessCode: string
  reference: string
}

export interface PaymentVerification {
  reference: string
  status: string
  amount: number
  currency: string
  paidAt: string | null
  gatewayResponse: string
}

export interface InitializePaymentInput {
  email: string
  amountKobo: number
  reference: string
  callbackUrl?: string
}

export interface Bank {
  name: string
  code: string
  slug: string
}

export interface ResolvedAccount {
  accountNumber: string
  accountName: string
}

export interface PayoutAccount {
  bankCode: string | null
  accountNumber: string | null
  accountName: string | null
  subaccountCode: string | null
  isComplete: boolean
}

export interface SetupPayoutInput {
  bankCode: string
  accountNumber: string
}
