import type { Me } from './profile-api';

/**
 * A profile is considered complete when the routing gate may safely send the
 * user to their role dashboard. First-time users land here on profile-setup.
 */
export function profileComplete(me: Me | null | undefined): boolean {
  if (!me) return false;
  if (!me.fullName?.trim()) return false;
  if (!me.country?.trim()) return false;

  if (me.accountType === 'student') {
    return !!me.studentProfile;
  }

  if (me.accountType === 'business') {
    return !!me.businessProfile?.companyName?.trim();
  }

  return false;
}
