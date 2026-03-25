import type { Request } from 'express';
import { verifyAccessToken } from '../auth/jwt';

export interface GatewayContext {
  userId?: string;
  email?: string;
  accountType?: 'student' | 'business';
  isVerified?: boolean;
}

// Extracts user identity from the Authorization header for the Apollo Gateway context.
// The gateway then forwards this as x-user-* headers to each subgraph.
export function buildGatewayContext({ req }: { req: Request }): GatewayContext {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return {};

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    return {
      userId: payload.sub,
      email: payload.email,
      accountType: payload.accountType,
      isVerified: payload.isVerified,
    };
  } catch {
    // Invalid/expired token — treat as unauthenticated
    // Subgraphs will enforce auth for protected resolvers
    return {};
  }
}
