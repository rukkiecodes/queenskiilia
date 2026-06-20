/**
 * Client-side in-memory access token.
 *
 * The access token is stored in an HttpOnly cookie (readable on the server) and
 * mirrored here in memory for the client, where the HttpOnly cookie is NOT
 * JS-readable. The auth store (Batch 0.4/0.5) calls `setAccessTokenMemory()` on
 * login and on SSR→client hydration; `gqlFetch` reads it on the client.
 *
 * Kept in a tiny standalone module (not the store) so the low-level GraphQL client
 * has no dependency on Pinia and stays trivially testable.
 */
let memoryToken: string | null = null

export function setAccessTokenMemory(token: string | null): void {
  // Guard: this module-level var is shared across requests on the server, so it
  // must only ever hold a client-side value. SSR auth reads the cookie instead.
  if (import.meta.server) return
  memoryToken = token
}

export function getAccessTokenMemory(): string | null {
  return memoryToken
}
