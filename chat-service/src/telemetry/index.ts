import { randomUUID } from 'crypto';
import { loggingDb } from '../shared/loggingDb';
import { env } from '../config/env';

export interface TelemetryEvent {
  operationType: 'query' | 'mutation' | 'subscription' | 'http' | 'internal';
  operationName: string;
  resolverPath?: string;
  userId?: string;
  durationMs: number;
  status: 'success' | 'error';
  errorMessage?: string;
  errorCode?: string;
  meta?: Record<string, unknown>;
}

export function emitTelemetry(event: TelemetryEvent): void {
  const id        = randomUUID();
  const timestamp = new Date().toISOString();

  loggingDb.query(
    `INSERT INTO telemetry_events
       (id, service, operation_type, operation_name, resolver_path,
        user_id, duration_ms, status, error_message, error_code, meta, timestamp)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      id, env.SERVICE_NAME,
      event.operationType, event.operationName,
      event.resolverPath ?? null,
      event.userId ?? null,
      event.durationMs, event.status,
      event.errorMessage ?? null,
      event.errorCode    ?? null,
      event.meta ? JSON.stringify(event.meta) : null,
      timestamp,
    ]
  ).catch((err: Error) => {
    console.error('[Telemetry] Write failed:', err.message);
  });

  loggingDb.query(
    `INSERT INTO service_heartbeats (service, last_seen_at)
     VALUES ($1, NOW())
     ON CONFLICT (service) DO UPDATE SET last_seen_at = NOW()`,
    [env.SERVICE_NAME]
  ).catch(() => {});

  if (event.durationMs > env.SLOW_THRESHOLD_MS) {
    console.warn(
      `[Telemetry] SLOW ${event.operationType.toUpperCase()} "${event.operationName}" — ${event.durationMs}ms`
    );
  }
}
