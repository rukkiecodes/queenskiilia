/**
 * Filter value types. The backend types these as plain `String` (validated in
 * resolvers), so these unions mirror the mobile client's accepted values for
 * cross-client parity — see client/mobile/lib/projects-api.ts.
 */
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export type ProjectSort = 'latest' | 'budget_high' | 'budget_low' | 'deadline_soon'

export const SKILL_LEVELS: readonly SkillLevel[] = [
  'beginner',
  'intermediate',
  'advanced',
  'expert',
] as const

export const PROJECT_SORTS: readonly ProjectSort[] = [
  'latest',
  'budget_high',
  'budget_low',
  'deadline_soon',
] as const

export const DEFAULT_PROJECT_SORT: ProjectSort = 'latest'
