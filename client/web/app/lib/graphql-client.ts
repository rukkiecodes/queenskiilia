import { getAccessTokenMemory, setAccessTokenMemory } from '~/lib/access-token'

/**
 * Minimal GraphQL transport for the QueenSkiilia federated gateway.
 *
 * - POSTs to `${apiUrl}/graphql`.
 * - Attaches `Authorization: Bearer <accessToken>` — resolved from the request
 *   cookie on the server, and from the in-memory token on the client.
 * - On an `UNAUTHENTICATED` GraphQL error it refreshes once (via the `/api/auth/*`
 *   BFF built in Batch 0.4) and retries; a second failure throws.
 * - Throws a typed `GqlError` carrying the gateway's GraphQL errors.
 *
 * No Apollo — mirrors the mobile client's deliberate fetch-based approach so the
 * GraphQL operation strings can be shared verbatim between the two clients.
 */

export interface GraphQLError {
  message: string
  path?: (string | number)[]
  extensions?: Record<string, unknown> & { code?: string }
}

export class GqlError extends Error {
  readonly errors: GraphQLError[]
  readonly status: number

  constructor(errors: GraphQLError[], status = 200) {
    super(errors[0]?.message ?? 'GraphQL request failed')
    this.name = 'GqlError'
    this.errors = errors
    this.status = status
  }

  /** First error's code (e.g. `UNAUTHENTICATED`, `FORBIDDEN`, `BAD_USER_INPUT`). */
  get code(): string | undefined {
    return this.errors[0]?.extensions?.code
  }
}

interface GqlResponse<T> {
  data?: T
  errors?: GraphQLError[]
}

export interface GqlFetchOptions {
  signal?: AbortSignal
  /** Override the token (mostly for tests / server utilities). */
  token?: string | null
  /** Internal: prevents an infinite refresh→retry loop. */
  _retried?: boolean
}

function resolveToken(): string | null {
  if (import.meta.server) {
    // Server can read the HttpOnly access cookie off the incoming request.
    return useCookie<string | null>('qs.accessToken').value ?? null
  }
  // Client: HttpOnly cookie is not JS-readable — use the in-memory mirror.
  return getAccessTokenMemory()
}

function isUnauthenticated(errors: GraphQLError[]): boolean {
  return errors.some(
    (e) =>
      e.extensions?.code === 'UNAUTHENTICATED' ||
      /not authenticated|unauthorized|jwt/i.test(e.message ?? ''),
  )
}

/**
 * Attempts a token refresh through the same-origin auth BFF (Batch 0.4).
 * Returns true if a fresh token is now available. Safe to call before 0.4 exists
 * (the route 404s → caught → returns false).
 */
async function tryRefresh(): Promise<boolean> {
  try {
    const res = await $fetch<{ accessToken?: string | null }>('/api/auth/refresh', {
      method: 'POST',
      headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
    })
    if (import.meta.client) setAccessTokenMemory(res?.accessToken ?? null)
    return Boolean(res?.accessToken)
  } catch {
    return false
  }
}

export async function gqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  opts: GqlFetchOptions = {},
): Promise<T> {
  const config = useRuntimeConfig()
  const endpoint = `${config.public.apiUrl}/graphql`
  const token = opts.token !== undefined ? opts.token : resolveToken()

  const res = await $fetch.raw<GqlResponse<T>>(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: { query, variables },
    signal: opts.signal,
    // Surface GraphQL-level errors ourselves rather than throwing on non-2xx.
    ignoreResponseError: true,
  })

  const payload = res._data
  const httpStatus = res.status

  if (payload?.errors?.length) {
    // Auto-refresh only on the client. On the server, an internal refresh can't
    // propagate the rotated Set-Cookie to the browser, so SSR re-auth is handled
    // upstream by the auth bootstrap (Feature 01) which holds the real request event.
    if (import.meta.client && isUnauthenticated(payload.errors) && !opts._retried) {
      const refreshed = await tryRefresh()
      if (refreshed) {
        return gqlFetch<T>(query, variables, { ...opts, token: undefined, _retried: true })
      }
    }
    throw new GqlError(payload.errors, httpStatus)
  }

  if (!payload || payload.data == null) {
    throw new GqlError(
      [{ message: `Empty GraphQL response (HTTP ${httpStatus})` }],
      httpStatus,
    )
  }

  return payload.data
}
