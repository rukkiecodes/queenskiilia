import { useAdminToken, useAdminRefresh, refreshAdminToken } from '~/lib/admin-api'

// Gate the /admin section. If the access token has expired but a refresh token
// is still valid, silently mint a new one rather than bouncing to login.
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/admin/login') return
  if (useAdminToken().value) return
  const ok = useAdminRefresh().value ? await refreshAdminToken() : false
  if (!ok) return navigateTo('/admin/login')
})
