import { GraphQLError } from 'graphql';

export function requireAuth(ctx: any): string {
  if (!ctx.userId) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return ctx.userId;
}
