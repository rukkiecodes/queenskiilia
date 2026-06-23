import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { paymentsApi } from '~/lib/payments-api'
import type { InitiateEscrowInput } from '~/types/payment'

export function useMyEscrows() {
  return useQuery({ queryKey: ['myEscrows'], queryFn: () => paymentsApi.myEscrows() })
}

export function useEscrow(projectId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['escrow', computed(() => toValue(projectId))],
    queryFn: () => paymentsApi.forProject(toValue(projectId)),
  })
}

export function useTransactions(escrowId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['transactions', computed(() => toValue(escrowId))],
    queryFn: () => paymentsApi.transactions(toValue(escrowId)),
    enabled: computed(() => !!toValue(escrowId)),
  })
}

export function useInitiateEscrow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: InitiateEscrowInput) => paymentsApi.initiate(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myEscrows'] }),
  })
}

export function useReleaseFunds() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) => paymentsApi.release(projectId),
    onSuccess: (_e, projectId) => {
      qc.invalidateQueries({ queryKey: ['myEscrows'] })
      qc.invalidateQueries({ queryKey: ['escrow', projectId] })
    },
  })
}

export function useRefundEscrow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) => paymentsApi.refund(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myEscrows'] }),
  })
}
