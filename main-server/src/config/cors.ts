import { env } from './env';

const exactOrigins = new Set(env.CORS_ORIGINS);

/**
 * Allow a request origin when it is absent (same-origin / server-to-server /
 * curl — no Origin header), present in the exact allow-list (CORS_ORIGINS), or
 * matches one of the configured regex patterns (CORS_ORIGIN_PATTERNS, e.g.
 * Vercel preview-deploy URLs whose subdomain changes per deployment).
 */
export function isAllowedOrigin(origin?: string | null): boolean {
  if (!origin) return true;
  if (exactOrigins.has(origin)) return true;
  return env.CORS_ORIGIN_PATTERNS.some((re) => re.test(origin));
}

/** Shared cors `origin` resolver for both Express (`cors`) and Socket.IO. */
export function corsOrigin(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
): void {
  if (isAllowedOrigin(origin)) callback(null, true);
  else callback(new Error(`Origin not allowed by CORS: ${origin ?? 'unknown'}`), false);
}
