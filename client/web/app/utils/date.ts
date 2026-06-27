import { format } from 'date-fns'

/** Parse an epoch-millisecond string or an ISO date string. Null if invalid. */
function toDate(v?: string | null): Date | null {
  if (!v) return null
  const d = /^\d+$/.test(v) ? new Date(Number(v)) : new Date(v)
  return isNaN(d.getTime()) ? null : d
}

/** Short human date, e.g. "Jun 27, 2026". Empty string if invalid. */
export function fmtDate(v?: string | null): string {
  const d = toDate(v)
  return d ? format(d, 'MMM d, yyyy') : ''
}
