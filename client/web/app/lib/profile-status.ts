import type { Me } from '~/types/profile'

/**
 * A profile is "complete" when the routing gate may send the user to their role
 * dashboard. Ported from client/mobile/lib/profile-status.ts.
 */
export function profileComplete(me: Me | null | undefined): boolean {
  if (!me) return false
  if (!me.fullName?.trim()) return false
  if (!me.country?.trim()) return false

  if (me.accountType === 'student') {
    return !!me.studentProfile
  }
  if (me.accountType === 'business') {
    return !!me.businessProfile?.companyName?.trim()
  }
  return false
}
