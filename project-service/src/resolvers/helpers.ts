import { GraphQLError } from 'graphql';

export function requireAuth(ctx: any): string {
  if (!ctx.userId) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return ctx.userId;
}

export function requireAccountType(ctx: any, type: 'student' | 'business'): void {
  if (ctx.accountType !== type) {
    throw new GraphQLError(`Only ${type} accounts can perform this action`, {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}
