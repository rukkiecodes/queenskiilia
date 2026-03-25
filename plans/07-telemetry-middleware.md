# Telemetry Middleware — All Services

Every GraphQL resolver (query, mutation, subscription) and every HTTP controller/endpoint across all Node.js microservices emits a structured telemetry event to the dedicated Logging DB (Supabase Postgres). The Super Admin service reads from the Logging DB to display live performance dashboards.

---

## Logging Database Connection

All services share the same dedicated Supabase logging database (separate from the main app database). This isolation means telemetry writes never contend with business data.

Each service initialises a small Postgres pool pointed at the logging DB:

```ts
// src/shared/loggingDb.ts (each service has its own copy)
import { Pool } from 'pg';

export const loggingDb = new Pool({
  connectionString: process.env.LOGGING_SUPERBASE_CONNECTION_STRING,
  max: 5,                      // small pool — telemetry is lower priority
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
```

---

## Telemetry Event Schema

Every operation emits this structured payload to the Logging DB:

```ts
interface TelemetryEvent {
  id: string;               // nanoid — unique event ID
  service: string;          // 'user-service' | 'project-service' | etc.
  operationType: 'query' | 'mutation' | 'subscription' | 'http' | 'internal';
  operationName: string;    // resolver name or HTTP route e.g. 'getUser' | 'POST /internal/send'
  resolverPath?: string;    // for nested resolvers e.g. 'User.profile'
  userId?: string;          // from GraphQL context (null if unauthenticated)
  durationMs: number;       // wall-clock time from start to finish
  status: 'success' | 'error';
  errorMessage?: string;    // first error message if status === 'error'
  errorCode?: string;       // GraphQL error extensions.code if available
  timestamp: string;        // ISO 8601
  meta?: Record<string, unknown>; // optional extra data (e.g. projectId, file size)
}
```

---

## Logging Database Schema

Two tables in the logging Supabase instance store all telemetry data.

### `telemetry_events`
```sql
CREATE TABLE telemetry_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service        TEXT NOT NULL,
  operation_type TEXT NOT NULL,   -- 'query' | 'mutation' | 'subscription' | 'http' | 'internal' | 'socket'
  operation_name TEXT NOT NULL,
  resolver_path  TEXT,
  user_id        TEXT,
  duration_ms    FLOAT NOT NULL,
  status         TEXT NOT NULL,   -- 'success' | 'error'
  error_message  TEXT,
  error_code     TEXT,
  meta           JSONB,
  timestamp      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tel_service   ON telemetry_events(service);
CREATE INDEX idx_tel_timestamp ON telemetry_events(timestamp DESC);
CREATE INDEX idx_tel_status    ON telemetry_events(status);
CREATE INDEX idx_tel_op_name   ON telemetry_events(operation_name);
CREATE INDEX idx_tel_user      ON telemetry_events(user_id);
```

### `service_heartbeats`
```sql
CREATE TABLE service_heartbeats (
  service      TEXT PRIMARY KEY,
  last_seen_at TIMESTAMPTZ NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

The super admin reads these two tables directly with SQL queries to power dashboards. No Redis, no pub/sub — analytics are derived from the event log at query time.

---

## Node.js Telemetry Module

A shared module dropped into every service at `src/telemetry/index.ts`:

```ts
// src/telemetry/index.ts
import { randomUUID } from 'crypto';
import { loggingDb } from '../shared/loggingDb';

const SERVICE_NAME = process.env.SERVICE_NAME!;
const SLOW_THRESHOLD_MS = parseInt(process.env.SLOW_THRESHOLD_MS ?? '500', 10);

export async function emitTelemetry(
  event: Omit<TelemetryEvent, 'id' | 'timestamp' | 'service'>
): Promise<void> {
  const payload: TelemetryEvent = {
    id: randomUUID(),
    service: SERVICE_NAME,
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
      payload.id, payload.service, payload.operationType, payload.operationName,
      payload.resolverPath ?? null, payload.userId ?? null, payload.durationMs,
      payload.status, payload.errorMessage ?? null, payload.errorCode ?? null,
      payload.meta ? JSON.stringify(payload.meta) : null, payload.timestamp,
    ]
  ).catch((err) => console.error('[Telemetry] Write failed:', err.message));

  // Upsert heartbeat — super admin uses this to detect dead services
  loggingDb.query(
    `INSERT INTO service_heartbeats (service, last_seen_at)
     VALUES ($1, NOW())
     ON CONFLICT (service) DO UPDATE SET last_seen_at = NOW()`,
    [SERVICE_NAME]
  ).catch(() => {});

  // Slow log entry logged to console in addition to DB
  if (payload.durationMs > SLOW_THRESHOLD_MS) {
    console.warn(
      `[Telemetry] SLOW ${payload.operationType.toUpperCase()} "${payload.operationName}" — ${payload.durationMs}ms`
    );
  }
}
```

---

## GraphQL Telemetry — Apollo Plugin

Applied to every Apollo Subgraph server via a custom plugin. This captures **per-resolver** and **per-operation** timing.

```ts
// src/telemetry/apolloPlugin.ts
import { ApolloServerPlugin } from '@apollo/server';
import { emitTelemetry } from './index';

export const telemetryPlugin: ApolloServerPlugin = {
  async requestDidStart(requestContext) {
    const operationStart = Date.now();
    const resolverTimings: Record<string, number> = {};

    return {
      // Per-resolver timing
      async executionDidStart() {
        return {
          willResolveField({ info }) {
            const fieldStart = Date.now();
            return async (error) => {
              const fieldKey = `${info.parentType.name}.${info.fieldName}`;
              resolverTimings[fieldKey] = Date.now() - fieldStart;

              // Emit individual resolver telemetry
              await emitTelemetry({
                operationType: 'query',   // overridden below per operation
                operationName: info.fieldName,
                resolverPath: fieldKey,
                userId: requestContext.contextValue?.userId,
                durationMs: resolverTimings[fieldKey],
                status: error ? 'error' : 'success',
                errorMessage: error?.message,
              });
            };
          },
        };
      },

      // Full operation telemetry
      async willSendResponse() {
        const operationType = requestContext.operation?.operation ?? 'query';
        const operationName =
          requestContext.request.operationName ??
          requestContext.operation?.selectionSet.selections[0]?.kind ?? 'anonymous';

        const hasErrors = (requestContext.response?.body as any)?.singleResult?.errors?.length > 0;

        await emitTelemetry({
          operationType: operationType as any,
          operationName: String(operationName),
          userId: requestContext.contextValue?.userId,
          durationMs: Date.now() - operationStart,
          status: hasErrors ? 'error' : 'success',
          errorMessage: hasErrors
            ? (requestContext.response?.body as any)?.singleResult?.errors?.[0]?.message
            : undefined,
          errorCode: hasErrors
            ? (requestContext.response?.body as any)?.singleResult?.errors?.[0]?.extensions?.code
            : undefined,
        });
      },
    };
  },
};
```

### Attaching the Plugin

In every service's `index.ts`:
```ts
const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
  plugins: [telemetryPlugin],   // <-- add this
});
```

---

## GraphQL Subscription Telemetry

Subscriptions use a separate wrapper since `willResolveField` doesn't fire for subscription resolvers.

```ts
// src/telemetry/subscriptionWrapper.ts
import { emitTelemetry } from './index';

export function withTelemetry<T>(
  subscriptionName: string,
  handler: (...args: any[]) => AsyncIterator<T>
) {
  return async function* (...args: any[]) {
    const start = Date.now();
    try {
      const iterator = handler(...args);
      for await (const value of iterator) {
        await emitTelemetry({
          operationType: 'subscription',
          operationName: subscriptionName,
          userId: args[2]?.userId,      // context is args[2] in subscription resolvers
          durationMs: Date.now() - start,
          status: 'success',
        });
        yield value;
      }
    } catch (err: any) {
      await emitTelemetry({
        operationType: 'subscription',
        operationName: subscriptionName,
        durationMs: Date.now() - start,
        status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  };
}
```

Usage in resolver:
```ts
subscribe: withTelemetry('onNewMessage', async (_, { chatId }, context) => {
  // ... pubsub logic
}),
```

---

## HTTP / Internal Endpoint Telemetry

Express middleware applied to all `app.use()` calls, including `/internal/*` routes:

```ts
// src/telemetry/httpMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { emitTelemetry } from './index';

export function httpTelemetry(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const route = `${req.method} ${req.route?.path ?? req.path}`;

  res.on('finish', async () => {
    const durationMs = Date.now() - start;
    const isError = res.statusCode >= 400;

    await emitTelemetry({
      operationType: req.path.startsWith('/internal') ? 'internal' : 'http',
      operationName: route,
      userId: (req as any).user?.id,
      durationMs,
      status: isError ? 'error' : 'success',
      errorMessage: isError ? `HTTP ${res.statusCode}` : undefined,
      meta: { statusCode: res.statusCode },
    });
  });

  next();
}
```

Attach in every service's `index.ts`:
```ts
app.use(httpTelemetry);   // before all routes
```

---

## Paystack Webhook Telemetry

The Paystack Service's webhook handler is also wrapped:

```ts
app.post('/webhooks/paystack', async (req, res) => {
  const start = Date.now();
  try {
    // ... verify signature and process event
    await emitTelemetry({
      operationType: 'http',
      operationName: `WEBHOOK paystack:${req.body.event}`,
      durationMs: Date.now() - start,
      status: 'success',
      meta: { event: req.body.event, reference: req.body.data?.reference },
    });
    res.sendStatus(200);
  } catch (err: any) {
    await emitTelemetry({
      operationType: 'http',
      operationName: `WEBHOOK paystack:${req.body.event}`,
      durationMs: Date.now() - start,
      status: 'error',
      errorMessage: err.message,
    });
    res.sendStatus(500);
  }
});
```

---

## Email Service Telemetry

The Email Service wraps its send function:

```ts
// Inside emailQueue.ts send logic
const start = Date.now();
try {
  await resend.emails.send({ ... });
  await emitTelemetry({
    operationType: 'internal',
    operationName: `email:${template}`,
    durationMs: Date.now() - start,
    status: 'success',
    meta: { template, to },
  });
} catch (err: any) {
  await emitTelemetry({
    operationType: 'internal',
    operationName: `email:${template}`,
    durationMs: Date.now() - start,
    status: 'error',
    errorMessage: err.message,
    meta: { template, to },
  });
}
```

---

## Service-Level `.env` Addition

Each service adds:
```env
SERVICE_NAME=user-service    # unique per service
SLOW_THRESHOLD_MS=500
```

---

## What Gets Logged Per Service

| Service | Operation Types Logged |
|---|---|
| main-server | HTTP auth routes, internal emit endpoint, Socket.IO connect/disconnect |
| user-service | All GraphQL queries + mutations + internal HTTP |
| project-service | All GraphQL queries + mutations + internal HTTP |
| skills-service | All GraphQL queries + mutations |
| portfolio-service | All GraphQL queries + mutations |
| payment-service | All GraphQL queries + mutations + Stripe webhooks |
| paystack-service | All GraphQL queries + mutations + Paystack webhooks |
| notification-service | All GraphQL queries + mutations + cron job runs |
| email-service | All `POST /internal/send` calls per template |
| rating-service | All GraphQL queries + mutations |
| dispute-service | All GraphQL queries + mutations |
| chat-service | All GraphQL queries + mutations + subscriptions |
| admin-service (Python) | All FastAPI endpoints |
