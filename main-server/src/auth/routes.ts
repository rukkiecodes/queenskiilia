import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { db } from '../shared/db';
import { createOtp, verifyOtp } from './otp';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './jwt';
import { sendEmail } from '../internal/emailClient';
import { otpRateLimit } from '../middleware/rateLimit';
import { emitTelemetry } from '../telemetry';

const router = Router();

// POST /auth/request-otp
// Body: { email: string, accountType: "student" | "business" }
router.post('/request-otp', otpRateLimit, async (req: Request, res: Response) => {
  const start = Date.now();
  const { email, accountType } = req.body;

  if (!email || !accountType) {
    res.status(400).json({ error: 'email and accountType are required' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }

  if (!['student', 'business'].includes(accountType)) {
    res.status(400).json({ error: 'accountType must be student or business' });
    return;
  }

  try {
    // Upsert user — create if first time, otherwise leave unchanged
    await db.query(
      `INSERT INTO users (email, account_type)
       VALUES ($1, $2)
       ON CONFLICT (email) DO NOTHING`,
      [email, accountType]
    );

    const otp = await createOtp(email);

    await sendEmail({
      to: email,
      template: 'otp',
      data: { otp, expiresInMinutes: 10 },
    });

    await emitTelemetry({
      operationType: 'http',
      operationName: 'POST /auth/request-otp',
      durationMs: Date.now() - start,
      status: 'success',
      meta: { accountType },
    });

    res.json({ message: 'OTP sent to your email' });
  } catch (err: any) {
    await emitTelemetry({
      operationType: 'http',
      operationName: 'POST /auth/request-otp',
      durationMs: Date.now() - start,
      status: 'error',
      errorMessage: err.message,
    });
    console.error('[Auth] request-otp error:', err.message);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

// POST /auth/verify-otp
// Body: { email: string, otp: string }
router.post('/verify-otp', async (req: Request, res: Response) => {
  const start = Date.now();
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400).json({ error: 'email and otp are required' });
    return;
  }

  try {
    const valid = await verifyOtp(email, otp);
    if (!valid) {
      res.status(401).json({ error: 'Invalid or expired OTP' });
      return;
    }

    // Mark email as verified and fetch user
    const userResult = await db.query(
      `UPDATE users
       SET email_verified = TRUE, updated_at = NOW()
       WHERE email = $1
       RETURNING id, email, account_type, is_verified`,
      [email]
    );

    const user = userResult.rows[0];

    // Issue access token
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      accountType: user.account_type,
      isVerified: user.is_verified,
    });

    // Issue refresh token and persist hash
    const tokenId = randomUUID();
    const refreshToken = signRefreshToken({ sub: user.id, tokenId });
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30d

    await db.query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [tokenId, user.id, refreshHash, refreshExpiry.toISOString()]
    );

    await emitTelemetry({
      operationType: 'http',
      operationName: 'POST /auth/verify-otp',
      userId: user.id,
      durationMs: Date.now() - start,
      status: 'success',
    });

    // Refresh token in HttpOnly cookie; access token in response body
    res
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/auth',
      })
      .json({
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          accountType: user.account_type,
          isVerified: user.is_verified,
        },
      });
  } catch (err: any) {
    await emitTelemetry({
      operationType: 'http',
      operationName: 'POST /auth/verify-otp',
      durationMs: Date.now() - start,
      status: 'error',
      errorMessage: err.message,
    });
    console.error('[Auth] verify-otp error:', err.message);
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
});

// POST /auth/refresh
// Reads refresh token from HttpOnly cookie, issues new access token
router.post('/refresh', async (req: Request, res: Response) => {
  const start = Date.now();
  const refreshToken: string | undefined = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);

    // Check token exists in DB, is not revoked, and not expired
    const tokenResult = await db.query(
      `SELECT id, token_hash
       FROM refresh_tokens
       WHERE id = $1
         AND user_id = $2
         AND revoked = FALSE
         AND expires_at > NOW()`,
      [payload.tokenId, payload.sub]
    );

    if (tokenResult.rowCount === 0) {
      res.status(401).json({ error: 'Refresh token invalid or expired' });
      return;
    }

    const { token_hash } = tokenResult.rows[0];
    const hashValid = await bcrypt.compare(refreshToken, token_hash);
    if (!hashValid) {
      res.status(401).json({ error: 'Refresh token tampered' });
      return;
    }

    // Fetch current user state
    const userResult = await db.query(
      `SELECT id, email, account_type, is_verified
       FROM users WHERE id = $1 AND is_active = TRUE`,
      [payload.sub]
    );

    if (userResult.rowCount === 0) {
      res.status(401).json({ error: 'User not found or suspended' });
      return;
    }

    const user = userResult.rows[0];

    // Rotate: revoke old token, issue new pair
    await db.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1`, [payload.tokenId]);

    const newTokenId = randomUUID();
    const newAccessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      accountType: user.account_type,
      isVerified: user.is_verified,
    });
    const newRefreshToken = signRefreshToken({ sub: user.id, tokenId: newTokenId });
    const newRefreshHash = await bcrypt.hash(newRefreshToken, 10);
    const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [newTokenId, user.id, newRefreshHash, newExpiry.toISOString()]
    );

    await emitTelemetry({
      operationType: 'http',
      operationName: 'POST /auth/refresh',
      userId: user.id,
      durationMs: Date.now() - start,
      status: 'success',
    });

    res
      .cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/auth',
      })
      .json({ accessToken: newAccessToken });
  } catch (err: any) {
    await emitTelemetry({
      operationType: 'http',
      operationName: 'POST /auth/refresh',
      durationMs: Date.now() - start,
      status: 'error',
      errorMessage: err.message,
    });
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /auth/logout
// Revokes the current refresh token
router.post('/logout', async (req: Request, res: Response) => {
  const refreshToken: string | undefined = req.cookies?.refreshToken;

  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await db.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1`, [payload.tokenId]);
    } catch {
      // Token already invalid — that's fine
    }
  }

  res.clearCookie('refreshToken', { path: '/auth' }).json({ message: 'Logged out' });
});

export { router as authRouter };
