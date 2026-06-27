/**
 * Admin auth + GraphQL transport. Admins are a separate identity from app users
 * (dedicated `admins` table, `POST /auth/admin/login`), so they get their own
 * token cookie and fetch helper rather than reusing the user `qs.accessToken`.
 *
 * The admin JWT carries `isAdmin: true`; the gateway forwards it to subgraphs as
 * `x-user-admin`, where admin-only resolvers gate on it.
 */

export interface AdminInfo {
  id: string
  email: string
  name?: string | null
}

/** JS-readable cookies (the admin SPA reads the token to attach Authorization). */
export function useAdminToken() {
  return useCookie<string | null>('qs.adminToken', {
    sameSite: 'lax',
    secure: true,
    maxAge: 60 * 60 * 8,
    default: () => null,
  })
}

export function useAdminInfo() {
  return useCookie<AdminInfo | null>('qs.adminInfo', {
    sameSite: 'lax',
    secure: true,
    maxAge: 60 * 60 * 8,
    default: () => null,
  })
}

/** Long-lived admin refresh token — used to silently mint fresh access tokens. */
export function useAdminRefresh() {
  return useCookie<string | null>('qs.adminRefresh', {
    sameSite: 'lax',
    secure: true,
    maxAge: 60 * 60 * 24 * 30,
    default: () => null,
  })
}

export async function adminLogin(email: string, password: string): Promise<AdminInfo> {
  const config = useRuntimeConfig()
  const res = await $fetch<{ accessToken: string; refreshToken: string; admin: AdminInfo }>(
    `${config.public.apiUrl}/auth/admin/login`,
    { method: 'POST', body: { email, password } },
  )
  useAdminToken().value = res.accessToken
  useAdminRefresh().value = res.refreshToken
  useAdminInfo().value = res.admin
  return res.admin
}

export function adminLogout() {
  useAdminToken().value = null
  useAdminRefresh().value = null
  useAdminInfo().value = null
}

/** Exchange the refresh token for a fresh access token. Returns false if there's
 *  no refresh token or it's expired (→ the caller should send them to login). */
export async function refreshAdminToken(): Promise<boolean> {
  const rt = useAdminRefresh().value
  if (!rt) return false
  const config = useRuntimeConfig()
  try {
    const res = await $fetch<{ accessToken: string; admin: AdminInfo }>(
      `${config.public.apiUrl}/auth/admin/refresh`,
      { method: 'POST', body: { refreshToken: rt } },
    )
    useAdminToken().value = res.accessToken
    useAdminInfo().value = res.admin
    return true
  } catch {
    return false
  }
}

/** GraphQL fetch authenticated as the admin. Throws on GraphQL/transport errors. */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function adminGqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  attempt = 0,
): Promise<T> {
  const config = useRuntimeConfig()
  const token = useAdminToken().value
  const res = await $fetch.raw<{
    data?: T
    error?: string
    errors?: { message: string; extensions?: { code?: string } }[]
  }>(`${config.public.apiUrl}/graphql`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: { query, variables },
    ignoreResponseError: true,
  })
  const payload = res._data

  // The federated gateway is serverless: a cold start returns a 5xx or a
  // "gateway is starting" body while it composes. Wait briefly and retry.
  const coldStart = res.status >= 500 || /starting/i.test(payload?.error ?? '')
  if (coldStart && attempt < 3) {
    await sleep(1500)
    return adminGqlFetch<T>(query, variables, attempt + 1)
  }

  if (payload?.errors?.length) {
    const e = payload.errors[0]
    // An expired access token surfaces as UNAUTHENTICATED, or FORBIDDEN
    // "Admin access required" (the gateway drops the identity). Refresh once.
    const authErr =
      e?.extensions?.code === 'UNAUTHENTICATED' ||
      e?.extensions?.code === 'FORBIDDEN' ||
      /admin access required|unauthenticated|jwt/i.test(e?.message ?? '')
    if (authErr && attempt < 3) {
      const refreshed = await refreshAdminToken()
      if (refreshed) return adminGqlFetch<T>(query, variables, attempt + 1)
    }
    throw new Error(e?.message ?? 'GraphQL error')
  }
  if (!payload?.data) throw new Error(`Empty response (HTTP ${res.status})`)
  return payload.data
}
