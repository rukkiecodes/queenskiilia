import type { Request, Response, NextFunction } from 'express';
import { emitTelemetry } from './index';

export function httpTelemetry(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const isError = res.statusCode >= 400;

    // Best-effort: don't await — fire and forget to avoid blocking the response cycle
    emitTelemetry({
      operationType: req.path.startsWith('/internal') ? 'internal' : 'http',
      operationName: `${req.method} ${req.route?.path ?? req.path}`,
      userId: (req as any).user?.id,
      durationMs,
      status: isError ? 'error' : 'success',
      errorMessage: isError ? `HTTP ${res.statusCode}` : undefined,
      meta: { statusCode: res.statusCode, ip: req.ip },
    }).catch(() => {
      // Silently discard telemetry errors — never affect request path
    });
  });

  next();
}
