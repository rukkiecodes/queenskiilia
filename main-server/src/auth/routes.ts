import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { db } from '../shared/db';
import { createOtp, verifyOtp } from './otp';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signAdminRefreshToken,
  verifyAdminRefreshToken,
} from './jwt';
import { sendEmail } from '../internal/emailClient';
import { otpRateLimit } from '../middleware/rateLimit';

const router = Router();

// POST /auth/request-otp
// Body: { email: string, accountType: "student" | "business" }
router.post('/request-otp', otpRateLimit, async (req: Request, res: Response) => {
  const { email, accountType } = req.body;

  if (!email) {
    res.status(400).json({ error: 'email is required' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }

  try {
    if (accountType) {
      // Sign up: `accountType` is the role chosen at the start of onboarding.
      // Create the account on first sight; leave an existing one unchanged.
      if (!['student', 'business'].includes(accountType)) {
        res.status(400).json({ error: 'accountType must be student or business' });
        return;
      }
      await db.query(
        `INSERT INTO users (email, account_type)
         VALUES ($1, $2)
         ON CONFLICT (email) DO NOTHING`,
        [email, accountType]
      );
    } else {
      // Log in: no role is chosen — the account (and its type) must already
      // exist. We never create one here, so a typo can't spawn a stray account.
      const { rows } = await db.query(`SELECT id FROM users WHERE email = $1`, [email]);
      if (rows.length === 0) {
        res.status(404).json({ error: 'No account found for this email. Please sign up first.' });
        return;
      }
    }

    const otp = await createOtp(email);

    await sendEmail({
      to: email,
      template: 'otp',
      data: { otp, expiresInMinutes: 10 },
    });

    res.json({ message: 'OTP sent to your email' });
  } catch (err: any) {
    console.error('[Auth] request-otp error:', err.message);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

// POST /auth/verify-otp
// Body: { email: string, otp: string }
router.post('/verify-otp', async (req: Request, res: Response) => {
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

    const userResult = await db.query(
      `UPDATE users
       SET email_verified = TRUE, updated_at = NOW()
       WHERE email = $1
       RETURNING id, email, account_type, is_verified`,
      [email]
    );

    const user = userResult.rows[0];

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      accountType: user.account_type,
      isVerified: user.is_verified,
    });

    const tokenId = randomUUID();
    const refreshToken = signRefreshToken({ sub: user.id, tokenId });
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [tokenId, user.id, refreshHash, refreshExpiry.toISOString()]
    );

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
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          accountType: user.account_type,
          isVerified: user.is_verified,
        },
      });
  } catch (err: any) {
    console.error('[Auth] verify-otp error:', err.message);
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
});

// POST /auth/refresh
// Accepts refresh token from JSON body (mobile) or HttpOnly cookie (web).
router.post('/refresh', async (req: Request, res: Response) => {
  const refreshToken: string | undefined =
    req.body?.refreshToken ?? req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);

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

    res
      .cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/auth',
      })
      .json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /auth/logout
// Revokes the current refresh token (accepts from JSON body or cookie).
router.post('/logout', async (req: Request, res: Response) => {
  const refreshToken: string | undefined =
    req.body?.refreshToken ?? req.cookies?.refreshToken;

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

// POST /auth/admin/login — dedicated admin auth (separate `admins` table,
// email + bcrypt password). Issues an access token with `isAdmin: true`.
router.post('/admin/login', otpRateLimit, async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }
  try {
    const result = await db.query(
      `SELECT id, email, password_hash, name, is_active FROM admins WHERE email = $1`,
      [String(email).toLowerCase().trim()]
    );
    const admin = result.rows[0];
    if (!admin || admin.is_active === false || !(await bcrypt.compare(password, admin.password_hash))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    await db.query(`UPDATE admins SET last_login_at = NOW() WHERE id = $1`, [admin.id]);
    const accessToken = signAccessToken({ sub: admin.id, email: admin.email, isAdmin: true });
    const refreshToken = signAdminRefreshToken(admin.id);
    res.json({
      accessToken,
      refreshToken,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (err) {
    console.error('admin login error', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /auth/admin/refresh — exchange a valid admin refresh token for a fresh
// access token (re-checks the admin still exists and is active).
router.post('/admin/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body ?? {};
  if (!refreshToken) {
    res.status(400).json({ error: 'refreshToken is required' });
    return;
  }
  try {
    const { sub } = verifyAdminRefreshToken(refreshToken);
    const result = await db.query(
      `SELECT id, email, name, is_active FROM admins WHERE id = $1`,
      [sub]
    );
    const admin = result.rows[0];
    if (!admin || admin.is_active === false) {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }
    const accessToken = signAccessToken({ sub: admin.id, email: admin.email, isAdmin: true });
    res.json({ accessToken, admin: { id: admin.id, email: admin.email, name: admin.name } });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

export { router as authRouter };
