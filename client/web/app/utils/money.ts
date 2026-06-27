/** Format an amount as USD — the platform's single display currency. */
export function money(amount: number | null | undefined): string {
  const n = Number(amount ?? 0)
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}
