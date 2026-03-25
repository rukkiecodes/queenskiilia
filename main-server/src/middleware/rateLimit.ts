import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// General API rate limit — applied to all routes
export const globalRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

// Strict OTP rate limit — 5 requests per IP per 15 minutes
export const otpRateLimit = rateLimit({
  windowMs: env.OTP_RATE_LIMIT_WINDOW_MS,
  max: env.OTP_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many OTP requests. Please wait before trying again.' },
  // Key by IP + email to prevent abuse across different email addresses
  keyGenerator: (req) => {
    const ip = req.ip ?? 'unknown';
    const email = req.body?.email ?? '';
    return `${ip}:${email}`;
  },
});
