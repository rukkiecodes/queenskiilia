import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { portfolioApi } from '~/lib/portfolio-api'

export function useMyPortfolio() {
  return useQuery({ queryKey: ['myPortfolio'], queryFn: () => portfolioApi.mine() })
}

export function useStudentPortfolio(studentId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['studentPortfolio', computed(() => toValue(studentId))],
    queryFn: () => portfolioApi.forStudent(toValue(studentId)),
  })
}

export function usePortfolioItem(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['portfolioItem', computed(() => toValue(id))],
    queryFn: () => portfolioApi.get(toValue(id)),
  })
}

export function useSetVisibility() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; isPublic: boolean }) =>
      portfolioApi.setVisibility(vars.id, vars.isPublic),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myPortfolio'] }),
  })
}
