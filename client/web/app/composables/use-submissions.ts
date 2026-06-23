import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { submissionsApi } from '~/lib/submissions-api'
import type { SubmitWorkInput } from '~/types/submission'

export function useSubmission(projectId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['submission', computed(() => toValue(projectId))],
    queryFn: () => submissionsApi.get(toValue(projectId)),
  })
}

export function useSubmitWork() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SubmitWorkInput) => submissionsApi.submit(input),
    onSuccess: (_s, input) => {
      qc.invalidateQueries({ queryKey: ['submission', input.projectId] })
      qc.invalidateQueries({ queryKey: ['project', input.projectId] })
    },
  })
}

export function useReviewSubmission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { projectId: string; approve: boolean; feedback?: string }) =>
      submissionsApi.review(vars.projectId, vars.approve, vars.feedback),
    onSuccess: (_s, vars) => {
      // Approval releases funds, completes the project, and auto-creates a portfolio item.
      qc.invalidateQueries({ queryKey: ['submission', vars.projectId] })
      qc.invalidateQueries({ queryKey: ['project', vars.projectId] })
      qc.invalidateQueries({ queryKey: ['myEscrows'] })
      qc.invalidateQueries({ queryKey: ['myPortfolio'] })
    },
  })
}
