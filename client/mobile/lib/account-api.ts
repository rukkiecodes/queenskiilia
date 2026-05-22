import { gqlFetch } from './graphql-client';

const DELETE_ACCOUNT = `
  mutation DeleteAccount($confirmation: String!) {
    deleteAccount(confirmation: $confirmation)
  }
`;

export const accountApi = {
  /**
   * Permanently requests account deletion. The backend soft-deletes
   * immediately (is_active=false, all refresh tokens revoked) and tombstones
   * the row after the 30-day grace window. `confirmation` must be the literal
   * string "DELETE" — the UI gates this with a type-to-confirm input.
   */
  deleteAccount: (confirmation: string) =>
    gqlFetch<{ deleteAccount: boolean }>(DELETE_ACCOUNT, { confirmation }).then(
      (r) => r.deleteAccount,
    ),
};
