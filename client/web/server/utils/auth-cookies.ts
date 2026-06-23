import type { H3Event } from 'h3'

/**
 * Single source of truth for the web app's auth cookies.
 *
 * - `qs.accessToken`  — short-lived JWT (7d) the gateway accepts as Bearer.
 * - `qs.refreshToken` — long-lived rotating token (30d); the sensitive credential.
 *
 * Both are HttpOnly so the refresh token is never JS-readable. (The access token
 * is additionally surfaced to client memory via `/api/auth/me-token` for direct
 * client→gateway GraphQL calls — see app/lib/access-token.ts.)
 */
export const AUTH_COOKIE = {
  ACCESS: 'qs.accessToken',
  REFRESH: 'qs.refreshToken',
} as const

const ACCESS_MAX_AGE = 60 * 60 * 24 * 7 // 7 days (matches access JWT lifetime)
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30 // 30 days (matches refresh token lifetime)

function baseOptions() {
  return {
    httpOnly: true,
    // Must be false over http://localhost in dev or the browser drops the cookie.
    secure: !import.meta.dev,
    sameSite: 'lax' as const,
    path: '/',
  }
}

export function setAuthCookies(event: H3Event, accessToken: string, refreshToken: string): void {
  setCookie(event, AUTH_COOKIE.ACCESS, accessToken, { ...baseOptions(), maxAge: ACCESS_MAX_AGE })
  setCookie(event, AUTH_COOKIE.REFRESH, refreshToken, { ...baseOptions(), maxAge: REFRESH_MAX_AGE })
}

export function clearAuthCookies(event: H3Event): void {
  deleteCookie(event, AUTH_COOKIE.ACCESS, { ...baseOptions() })
  deleteCookie(event, AUTH_COOKIE.REFRESH, { ...baseOptions() })
}

export function getAccessCookie(event: H3Event): string | undefined {
  return getCookie(event, AUTH_COOKIE.ACCESS)
}

export function getRefreshCookie(event: H3Event): string | undefined {
  return getCookie(event, AUTH_COOKIE.REFRESH)
}

/**
 * Rewrite the INCOMING request's cookie header so SSR (and any internal $fetch that
 * forwards cookies) sees a freshly-rotated token within the same request — used by
 * the edge refresh middleware after rotating cookies on the response.
 */
export function setRequestCookie(event: H3Event, name: string, value: string): void {
  const raw = event.node.req.headers.cookie || ''
  const pairs = raw
    .split(';')
    .map((s) => s.trim())
    .filter((p) => p && !p.startsWith(`${name}=`))
  if (value) pairs.push(`${name}=${value}`)
  event.node.req.headers.cookie = pairs.join('; ')
  // Invalidate h3's parsed-cookie cache if present.
  if (event.context) delete (event.context as Record<string, unknown>).cookies
}
