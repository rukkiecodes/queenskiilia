import type { SkillLevel } from '~/types/filters'

/**
 * Business talent-search filters, backed by the URL query (shareable / refresh-safe).
 * Returns writable computed refs plus `queryArgs` for the `users()` query.
 *
 * Query keys: q (search), level, country, rating (minRating).
 */
export function useTalentFilters() {
  const route = useRoute()
  const router = useRouter()

  function setQuery(patch: Record<string, string | undefined>) {
    const query: Record<string, unknown> = { ...route.query, ...patch }
    for (const key of Object.keys(query)) {
      if (query[key] === undefined) delete query[key]
    }
    router.replace({ query })
  }

  const search = computed<string>({
    get: () => (route.query.q as string) ?? '',
    set: (v) => setQuery({ q: v || undefined }),
  })

  const skillLevel = computed<SkillLevel | null>({
    get: () => ((route.query.level as SkillLevel) || null),
    set: (v) => setQuery({ level: v ?? undefined }),
  })

  const country = computed<string | null>({
    get: () => ((route.query.country as string) || null),
    set: (v) => setQuery({ country: v ?? undefined }),
  })

  const minRating = computed<number | null>({
    get: () => (route.query.rating ? Number(route.query.rating) : null),
    set: (v) => setQuery({ rating: v != null ? String(v) : undefined }),
  })

  function reset() {
    setQuery({ q: undefined, level: undefined, country: undefined, rating: undefined })
  }

  /** Arguments for the `users()` query — only the set fields. */
  const queryArgs = computed(() => ({
    accountType: 'student' as const,
    search: search.value || undefined,
    skillLevel: skillLevel.value ?? undefined,
    country: country.value ?? undefined,
    minRating: minRating.value ?? undefined,
  }))

  return { search, skillLevel, country, minRating, reset, queryArgs }
}
