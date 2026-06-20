import { useMutation } from '@tanstack/vue-query'
import { accountApi } from '~/lib/account-api'

export function useDeleteAccount() {
  return useMutation({ mutationFn: (confirmation: string) => accountApi.deleteAccount(confirmation) })
}
