import { randomUUID } from 'crypto';
import { loggingDb } from '../shared/loggingDb';
import { env } from '../config/env';

export interface TelemetryEvent {
  id: string;
  service: string;
  operationType: 'query' | 'mutation' | 'subscription' | 'http' | 'internal' | 'socket';
  operationName: string;
  resolverPath?: string;
  userId?: string;
  durationMs: number;
  status: 'success' | 'error';
  errorMessage?: string;
  errorCode?: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export async function emitTelemetry(
  event: Omit<TelemetryEvent, 'id' | 'timestamp' | 'service'>
): Promise<void> {
  const payload: TelemetryEvent = {
    id: randomUUID(),
    service: env.SERVICE_NAME,
    timestamp: new Date().toISOString(),
    ...event,
  };

  // Fire and forget — never block the request path
  loggingDb.query(
    `INSERT INTO telemetry_events
       (id, service, operation_type, operation_name, resolver_path,
        user_id, duration_ms, status, error_message, error_code, meta, timestamp)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      payload.id,
      payload.service,
      payload.operationType,
      payload.operationName,
      payload.resolverPath ?? null,
      payload.userId ?? null,
      payload.durationMs,
      payload.status,
      payload.errorMessage ?? null,
      payload.errorCode ?? null,
      payload.meta ? JSON.stringify(payload.meta) : null,
      payload.timestamp,
    ]
  ).catch((err: Error) => {
    console.error('[Telemetry] Write failed:', err.message);
  });

  // Upsert heartbeat — super admin uses this to detect dead/degraded services
  loggingDb.query(
    `INSERT INTO service_heartbeats (service, last_seen_at)
     VALUES ($1, NOW())
     ON CONFLICT (service) DO UPDATE SET last_seen_at = NOW()`,
    [env.SERVICE_NAME]
  ).catch(() => {});

  // Log slow operations to console so they're visible during development
  if (payload.durationMs > env.SLOW_THRESHOLD_MS) {
    console.warn(
      `[Telemetry] SLOW ${payload.operationType.toUpperCase()} "${payload.operationName}" — ${payload.durationMs}ms`
    );
  }
}
