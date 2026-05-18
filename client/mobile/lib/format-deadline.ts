/**
 * Render a project deadline relative to now in Apple's terse style.
 *   ─5d    → "Overdue · 5d"
 *    0d    → "Due today"
 *    1d    → "Due tomorrow"
 *    2-13d → "X days left"
 *    14-29d → "X weeks left"   (rounded down)
 *    30+d  → "X months left"   (rounded down)
 */
export function formatDeadline(iso: string): string {
  const deadline = new Date(iso).getTime();
  if (Number.isNaN(deadline)) return '';

  const now = Date.now();
  const dayMs = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((deadline - now) / dayMs);

  if (diffDays < 0) return `Overdue · ${Math.abs(diffDays)}d`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays < 14) return `${diffDays} days left`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks left`;
  return `${Math.floor(diffDays / 30)} months left`;
}

/**
 * Some subgraphs serialize timestamps as epoch milliseconds in a string
 * (e.g. "1778279357935") rather than ISO 8601. `new Date(...)` only accepts
 * the ISO form, so this helper coerces both.
 */
export function parseDate(input: string | number | Date): Date {
  if (input instanceof Date) return input;
  if (typeof input === 'number') return new Date(input);
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return new Date(Number(trimmed));
  return new Date(trimmed);
}

export function formatBudget(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}
