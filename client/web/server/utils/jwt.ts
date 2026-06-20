/** Decode a JWT payload server-side (Nitro). No signature verification. */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const b64 = parts[1]!.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
  } catch {
    return null
  }
}

/** True if the access token is missing an `exp` in the future (with clock skew). */
export function isAccessExpired(token: string, skewSeconds = 30): boolean {
  const payload = decodeJwtPayload(token)
  const exp = typeof payload?.exp === 'number' ? payload.exp : undefined
  if (!exp) return false
  return exp * 1000 <= Date.now() + skewSeconds * 1000
}
