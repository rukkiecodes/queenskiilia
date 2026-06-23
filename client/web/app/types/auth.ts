export type AccountType = 'student' | 'business'

/** The minimal session user returned by the auth flow (verify-otp / me-token). */
export interface AuthUser {
  id: string
  email: string
  accountType: AccountType
  isVerified: boolean
}
