import type { AccountType, AuthUser } from '~/types/auth'

interface AccessClaims {
  sub: string
  email: string
  accountType: AccountType
  isVerified: boolean
  exp?: number
  iat?: number
}

function base64UrlDecode(input: string): string {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4))
  const b64 = (input + pad).replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64) // available in the browser and modern Node (SSR)
  try {
    return decodeURIComponent(
      Array.from(bin, (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
    )
  } catch {
    return bin
  }
}

/** Decode a JWT payload (no signature check — the gateway validates on each call). */
export function decodeJwt<T = AccessClaims>(token: string): T | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    return JSON.parse(base64UrlDecode(parts[1]!)) as T
  } catch {
    return null
  }
}

/** Reconstruct the session user from the access token's claims. */
export function userFromToken(token: string): AuthUser | null {
  const c = decodeJwt<AccessClaims>(token)
  if (!c?.sub) return null
  return { id: c.sub, email: c.email, accountType: c.accountType, isVerified: c.isVerified }
}
