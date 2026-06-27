import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string;          // user id (or admin id when isAdmin)
  email: string;
  accountType?: 'student' | 'business';
  isVerified?: boolean;
  isAdmin?: boolean;    // set on admin tokens (separate admins table)
}

export interface RefreshTokenPayload {
  sub: string;          // user id
  tokenId: string;      // matches refresh_tokens.id in DB — enables single-token revocation
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

// Admin refresh tokens are self-contained (no DB row): a long-lived JWT marked
// `adminRefresh` so it can only mint admin access tokens, never user ones.
export function signAdminRefreshToken(adminId: string): string {
  return jwt.sign({ sub: adminId, adminRefresh: true }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });
}

export function verifyAdminRefreshToken(token: string): { sub: string } {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as any;
  if (!payload?.adminRefresh || !payload?.sub) {
    throw new Error('Not a valid admin refresh token');
  }
  return { sub: payload.sub as string };
}
