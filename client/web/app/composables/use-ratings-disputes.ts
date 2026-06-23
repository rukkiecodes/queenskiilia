import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { ratingsApi } from '~/lib/ratings-api'
import { disputesApi } from '~/lib/disputes-api'
import { reportsApi } from '~/lib/reports-api'
import type { SubmitRatingInput } from '~/types/rating'
import type { RaiseDisputeInput } from '~/types/dispute'
import type { SubmitReportInput } from '~/types/report'

/* ── Ratings ───────────────────────────────────────────── */
export function useUserRatings(userId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['userRatings', computed(() => toValue(userId))],
    queryFn: () => ratingsApi.forUser(toValue(userId)),
  })
}
export function useProjectRatings(projectId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['projectRatings', computed(() => toValue(projectId))],
    queryFn: () => ratingsApi.forProject(toValue(projectId)),
  })
}
export function useSubmitRating() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SubmitRatingInput) => ratingsApi.submit(input),
    onSuccess: (_r, input) => {
      qc.invalidateQueries({ queryKey: ['projectRatings', input.projectId] })
      qc.invalidateQueries({ queryKey: ['userRatings', input.revieweeId] })
    },
  })
}

/* ── Disputes ──────────────────────────────────────────── */
export function useProjectDispute(projectId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['projectDispute', computed(() => toValue(projectId))],
    queryFn: () => disputesApi.forProject(toValue(projectId)),
  })
}
export function useMyDisputes() {
  return useQuery({ queryKey: ['myDisputes'], queryFn: () => disputesApi.mine() })
}
export function useRaiseDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: RaiseDisputeInput) => disputesApi.raise(input),
    onSuccess: (_d, input) => {
      qc.invalidateQueries({ queryKey: ['myDisputes'] })
      qc.invalidateQueries({ queryKey: ['projectDispute', input.projectId] })
      qc.invalidateQueries({ queryKey: ['myEscrows'] })
    },
  })
}

/* ── Reports ───────────────────────────────────────────── */
export function useMyReports() {
  return useQuery({ queryKey: ['myReports'], queryFn: () => reportsApi.mine() })
}
export function useSubmitReport() {
  return useMutation({ mutationFn: (input: SubmitReportInput) => reportsApi.submit(input) })
}
