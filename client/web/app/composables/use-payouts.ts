import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { paystackApi } from '~/lib/paystack-api'
import type { SetupPayoutInput } from '~/types/payment'

/** List of NGN banks (for the payout bank dropdown). Cached aggressively. */
export function useBanks() {
  return useQuery({
    queryKey: ['paystackBanks'],
    queryFn: () => paystackApi.banks(),
    staleTime: 1000 * 60 * 60,
  })
}

/** The signed-in talent's saved payout details + subaccount status. */
export function useMyPayoutAccount() {
  return useQuery({ queryKey: ['myPayoutAccount'], queryFn: () => paystackApi.myPayoutAccount() })
}

/**
 * Resolve a bank account to its holder name. Auto-runs once a 10-digit account
 * number and a bank are present; no retry so a wrong number fails fast.
 */
export function useResolveAccount(
  accountNumber: MaybeRefOrGetter<string>,
  bankCode: MaybeRefOrGetter<string>,
) {
  return useQuery({
    queryKey: [
      'resolveAccount',
      computed(() => toValue(accountNumber)),
      computed(() => toValue(bankCode)),
    ],
    queryFn: () => paystackApi.resolveAccount(toValue(accountNumber), toValue(bankCode)),
    enabled: computed(() => toValue(accountNumber).trim().length === 10 && !!toValue(bankCode)),
    retry: 0,
    staleTime: 1000 * 60 * 5,
  })
}

/** Create/refresh the talent's Paystack subaccount from their bank details. */
export function useSetupPayout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SetupPayoutInput) => paystackApi.setupPayout(input),
    onSuccess: (account) => qc.setQueryData(['myPayoutAccount'], account),
  })
}
