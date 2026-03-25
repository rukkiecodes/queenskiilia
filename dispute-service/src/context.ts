import type { Request } from 'express';

export interface ServiceContext {
  userId?:      string;
  accountType?: string;
  isVerified?:  boolean;
}

// The gateway forwards user identity via x-user-* headers set in AuthenticatedDataSource
export function buildContext({ req }: { req: Request }): ServiceContext {
  const userId      = req.headers['x-user-id'] as string | undefined;
  const accountType = req.headers['x-user-account-type'] as string | undefined;
  const isVerified  = req.headers['x-user-verified'] === 'true';

  return { userId, accountType, isVerified };
}
