import { DEFAULT_PROJECT_SORT, type ProjectSort, type SkillLevel } from '~/types/filters'

/**
 * Student-marketplace filters, backed by the URL query (not a store) so they are
 * shareable, bookmarkable, refresh-safe, and back-button-correct — per the
 * vue-pinia-best-practices "URL state for ephemeral filters" guidance. Returns
 * writable computed refs (v-model friendly) plus `queryArgs` for the data layer.
 *
 * Query keys: q (search), level, min, max (budget), sort.
 */
export function useProjectFilters() {
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

  const budgetMin = computed<number | null>({
    get: () => (route.query.min ? Number(route.query.min) : null),
    set: (v) => setQuery({ min: v != null ? String(v) : undefined }),
  })

  const budgetMax = computed<number | null>({
    get: () => (route.query.max ? Number(route.query.max) : null),
    set: (v) => setQuery({ max: v != null ? String(v) : undefined }),
  })

  const sortBy = computed<ProjectSort>({
    get: () => ((route.query.sort as ProjectSort) || DEFAULT_PROJECT_SORT),
    set: (v) => setQuery({ sort: v && v !== DEFAULT_PROJECT_SORT ? v : undefined }),
  })

  function setBudget(min: number | null, max: number | null) {
    setQuery({
      min: min != null ? String(min) : undefined,
      max: max != null ? String(max) : undefined,
    })
  }

  function reset() {
    setQuery({ q: undefined, level: undefined, min: undefined, max: undefined, sort: undefined })
  }

  /** Arguments for the `projects()` query — only the set fields. */
  const queryArgs = computed(() => ({
    search: search.value || undefined,
    skillLevel: skillLevel.value ?? undefined,
    budgetMin: budgetMin.value ?? undefined,
    budgetMax: budgetMax.value ?? undefined,
    sortBy: sortBy.value,
  }))

  return { search, skillLevel, budgetMin, budgetMax, sortBy, setBudget, reset, queryArgs }
}
