import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { expressMiddleware } from '@apollo/server/express4';
import { randomUUID } from 'crypto';

import { env } from './config/env';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { buildContext } from './context';
import { resolverTelemetryPlugin } from './telemetry/resolverPlugin';
import { emitTelemetry } from './telemetry';
import { db } from './shared/db';

// ── Internal router ───────────────────────────────────────────────────────────

const internalRouter = express.Router();

internalRouter.post('/notify', async (req, res) => {
  const start = Date.now();

  // Validate internal secret
  const secret = req.headers['x-internal-secret'];
  if (secret !== env.INTERNAL_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { userId, type, title, body, metadata } = req.body as {
    userId:    string;
    type:      string;
    title:     string;
    body:      string;
    metadata?: Record<string, unknown>;
  };

  if (!userId || !type || !title || !body) {
    res.status(400).json({ error: 'Missing required fields: userId, type, title, body' });
    return;
  }

  try {
    const id = randomUUID();

    const result = await db.query(
      `INSERT INTO notifications (id, user_id, type, title, body, is_read, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, FALSE, $6, NOW())
       RETURNING *`,
      [
        id,
        userId,
        type,
        title,
        body,
        metadata != null ? JSON.stringify(metadata) : null,
      ]
    );

    const row = result.rows[0];
    const notification = {
      id:        row.id,
      userId:    row.user_id,
      type:      row.type,
      title:     row.title,
      body:      row.body,
      isRead:    row.is_read,
      metadata:  row.metadata != null ? JSON.stringify(row.metadata) : null,
      createdAt: row.created_at,
    };

    // Emit real-time event via main server
    try {
      await axios.post(
        `${env.MAIN_SERVER_URL}/internal/emit`,
        {
          room:  `user:${userId}`,
          event: 'notification:new',
          data:  notification,
        },
        {
          headers: {
            'Content-Type':     'application/json',
            'X-Internal-Secret': env.INTERNAL_SECRET,
          },
          timeout: 5_000,
        }
      );
    } catch (emitErr: any) {
      // Non-fatal: log but don't fail the notification creation
      console.warn('[Internal/notify] Failed to emit real-time event:', emitErr.message);
    }

    emitTelemetry({
      operationType: 'internal',
      operationName: 'notify',
      userId,
      durationMs: Date.now() - start,
      status: 'success',
      meta: { notificationId: notification.id, type },
    });

    res.status(201).json({ notification });
  } catch (err: any) {
    emitTelemetry({
      operationType: 'internal',
      operationName: 'notify',
      userId,
      durationMs: Date.now() - start,
      status: 'error',
      errorMessage: err.message,
    });

    console.error('[Internal/notify] Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function bootstrap() {
  const app        = express();
  const httpServer = http.createServer(app);

  app.use(cors());
  app.use(express.json());

  const server = new ApolloServer({
    schema:  buildSubgraphSchema({ typeDefs, resolvers }),
    plugins: [resolverTelemetryPlugin],
  });

  await server.start();

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => buildContext({ req }),
    })
  );

  app.use('/internal', internalRouter);

  app.get('/', (_req, res) => {
    res.json({
      service: env.SERVICE_NAME,
      status: 'ok',
      endpoints: { graphql: '/graphql', internal: '/internal/notify', health: '/health' },
      graphql: {
        queries:   ['myNotifications', 'unreadCount'],
        mutations: ['markAsRead', 'markAllAsRead', 'deleteNotification'],
      },
      internal: [
        { method: 'POST', path: '/internal/notify', description: 'Create and deliver a notification to a user' },
      ],
    });
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: env.SERVICE_NAME });
  });

  httpServer.listen(env.PORT, () => {
    console.log(`\n  [${env.SERVICE_NAME}] Running on http://localhost:${env.PORT}/graphql\n`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
