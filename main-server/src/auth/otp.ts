import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { db } from '../shared/db';
import { env } from '../config/env';

// Generate a zero-padded OTP of the configured length
function generateOtpCode(): string {
  const max = Math.pow(10, env.OTP_LENGTH);
  return String(randomInt(0, max)).padStart(env.OTP_LENGTH, '0');
}

export async function createOtp(email: string): Promise<string> {
  const otp = generateOtpCode();
  const hash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate any previous unused OTPs for this email to avoid confusion
  await db.query(
    `UPDATE otp_tokens SET used = TRUE
     WHERE email = $1 AND used = FALSE AND expires_at > NOW()`,
    [email]
  );

  await db.query(
    `INSERT INTO otp_tokens (email, otp_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [email, hash, expiresAt.toISOString()]
  );

  return otp;
}

export async function verifyOtp(email: string, otp: string): Promise<boolean> {
  const result = await db.query(
    `SELECT id, otp_hash
     FROM otp_tokens
     WHERE email = $1
       AND used = FALSE
       AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [email]
  );

  if (result.rowCount === 0) return false;

  const { id, otp_hash } = result.rows[0];
  const valid = await bcrypt.compare(otp, otp_hash);
  if (!valid) return false;

  // Mark as used immediately — single-use guarantee
  await db.query(`UPDATE otp_tokens SET used = TRUE WHERE id = $1`, [id]);
  return true;
}
