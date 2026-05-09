import { useAuthStore } from '@/store/auth-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('EXPO_PUBLIC_API_URL is not defined');
}

const GRAPHQL_ENDPOINT = `${API_URL}/graphql`;

export class GraphQLError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'GraphQLError';
  }
}

type GqlResponse<T> = {
  data?: T;
  errors?: { message: string; extensions?: { code?: string } }[];
};

const execute = async <T>(
  query: string,
  variables: Record<string, unknown> | undefined,
  token: string | null,
): Promise<GqlResponse<T>> => {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok && res.status !== 400) {
    throw new GraphQLError(`HTTP ${res.status}`);
  }

  return res.json() as Promise<GqlResponse<T>>;
};

export async function gqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const { accessToken, refreshAccessToken } = useAuthStore.getState();

  let result = await execute<T>(query, variables, accessToken);

  const isUnauthenticated = result.errors?.some(
    (e) => e.extensions?.code === 'UNAUTHENTICATED',
  );

  if (isUnauthenticated) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      result = await execute<T>(query, variables, newToken);
    }
  }

  if (result.errors?.length) {
    const first = result.errors[0];
    throw new GraphQLError(first.message, first.extensions?.code);
  }

  if (!result.data) {
    throw new GraphQLError('No data returned');
  }

  return result.data;
}
