import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { skillsApi } from '~/lib/skills-api'
import { useAuthStore } from '~/stores/auth'
import type { SkillLevel } from '~/types/filters'
import type { AnswerInput } from '~/types/skills'

/** Public skill-category catalogue. */
export function useSkillCategories() {
  return useQuery({ queryKey: ['skillCategories'], queryFn: () => skillsApi.categories() })
}

export function useMyAssessments() {
  return useQuery({ queryKey: ['myAssessments'], queryFn: () => skillsApi.myAssessments() })
}

export function useActiveSession() {
  return useQuery({ queryKey: ['activeSession'], queryFn: () => skillsApi.activeSession() })
}

export function useAssessment(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['assessment', computed(() => toValue(id))],
    queryFn: () => skillsApi.assessment(toValue(id)),
  })
}

export function useStartAssessment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { category: string; level: SkillLevel }) =>
      skillsApi.start(vars.category, vars.level),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activeSession'] }),
  })
}

export function useSubmitAssessment() {
  const qc = useQueryClient()
  const auth = useAuthStore()
  return useMutation({
    mutationFn: (vars: { sessionId: string; answers: AnswerInput[] }) =>
      skillsApi.submit(vars.sessionId, vars.answers),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myAssessments'] })
      qc.invalidateQueries({ queryKey: ['activeSession'] })
      // Skill level may have changed → refresh the profile (and marketplace eligibility).
      auth.fetchMe()
    },
  })
}
