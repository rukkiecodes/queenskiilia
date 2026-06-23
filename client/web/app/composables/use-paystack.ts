import { useMutation, useQuery } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { paystackApi } from '~/lib/paystack-api'
import type { InitializePaymentInput } from '~/types/payment'

export function useInitializePayment() {
  return useMutation({
    mutationFn: (input: InitializePaymentInput) => paystackApi.initialize(input),
  })
}

/** Verify a Paystack transaction by reference (used on the payment callback). */
export function useVerifyPayment(reference: MaybeRefOrGetter<string | undefined>) {
  return useQuery({
    queryKey: ['verifyPayment', computed(() => toValue(reference))],
    queryFn: () => paystackApi.verify(toValue(reference)!),
    enabled: computed(() => !!toValue(reference)),
    retry: 1,
  })
}
