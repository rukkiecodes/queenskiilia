/** Humanize a snake_case status for display: 'in_progress' → 'In progress'. */
export function statusLabel(status: string | null | undefined): string {
  if (!status) return ''
  const s = status.replace(/_/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}
