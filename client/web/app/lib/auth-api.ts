import type { AccountType, AuthUser } from '~/types/auth'

/**
 * Client wrappers for the same-origin auth BFF (`server/api/auth/*`). Cookies are
 * sent automatically; the browser never handles raw tokens.
 */

export interface RequestOtpInput {
  email: string
  /** Provided only when signing up (the chosen role). Omitted for login — the
   *  existing account already carries its type. */
  accountType?: AccountType
}

export interface VerifyOtpInput {
  email: string
  otp: string
}

export function requestOtp(input: RequestOtpInput) {
  return $fetch<{ message: string }>('/api/auth/request-otp', { method: 'POST', body: input })
}

export function verifyOtp(input: VerifyOtpInput) {
  return $fetch<{ user: AuthUser }>('/api/auth/verify-otp', { method: 'POST', body: input })
}

export function logoutRequest() {
  return $fetch<{ message: string }>('/api/auth/logout', { method: 'POST' })
}
