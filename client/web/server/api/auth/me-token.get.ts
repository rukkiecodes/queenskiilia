/**
 * Returns the current access token (read from the HttpOnly cookie) so the client
 * can load it into memory for direct client→gateway GraphQL calls. Returns
 * { accessToken: null } when there is no session.
 *
 * The refresh token is intentionally never exposed here.
 */
export default defineEventHandler((event) => {
  return { accessToken: getAccessCookie(event) ?? null }
})
