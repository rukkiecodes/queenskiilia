import { gqlFetch } from '~/lib/graphql-client'

// Soft-delete (Google Play 2024+): sets is_active=false, stamps deletion_requested_at,
// revokes refresh tokens; a cleanup job tombstones after a 30-day grace window.
// `confirmation` must equal "DELETE".
const DELETE_ACCOUNT = `mutation DeleteAccount($confirmation: String!) { deleteAccount(confirmation: $confirmation) }`

export const accountApi = {
  deleteAccount: (confirmation: string) =>
    gqlFetch<{ deleteAccount: boolean }>(DELETE_ACCOUNT, { confirmation }).then(
      (r) => r.deleteAccount,
    ),
}
