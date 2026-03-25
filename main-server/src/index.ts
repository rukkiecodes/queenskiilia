import 'dotenv/config';
import http from 'http';
import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { expressMiddleware } from '@apollo/server/express4';

import { env } from './config/env';
import { createApolloServer } from './gateway';
import { initSocketIO } from './socket';
import { authRouter } from './auth/routes';
import { internalRouter } from './internal/routes';
import { httpTelemetry } from './telemetry/httpMiddleware';
import { globalRateLimit } from './middleware/rateLimit';
import { buildGatewayContext } from './middleware/context';

// Gateway starts in the background and mounts itself once all subgraphs are reachable.
// The HTTP server (auth, socket, health) starts immediately without waiting.
async function startGatewayWithRetry(
  onReady: (middleware: RequestHandler) => void
): Promise<void> {
  const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  let attempt = 0;

  while (true) {
    // Fresh instance on every attempt — ApolloServer.start() is single-use.
    // A failed start permanently poisons the instance, so we never reuse one.
    const server = createApolloServer();
    try {
      await server.start();
      const middleware = expressMiddleware(server, {
        context: async ({ req }) => buildGatewayContext({ req }),
      });
      onReady(middleware);
      console.log('[Gateway] Connected to all subgraphs — GraphQL ready');
      return;
    } catch (err: any) {
      // Discard the poisoned instance — it will be GC'd
      await server.stop().catch(() => {});
      attempt++;
      const waitMs = Math.min(5_000 * attempt, 30_000);
      console.warn(
        `[Gateway] Subgraphs not reachable (attempt ${attempt}). Retrying in ${waitMs / 1_000}s…`
      );
      await delay(waitMs);
    }
  }
}

async function bootstrap() {
  const app = express();
  const httpServer = http.createServer(app);

  // ── Security ────────────────────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    })
  );

  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));

  // ── Body parsing ─────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  // ── Telemetry ─────────────────────────────────────────────────────────────────
  app.use(httpTelemetry);

  // ── Rate limiting ─────────────────────────────────────────────────────────────
  app.use(globalRateLimit);

  // ── Socket.IO ─────────────────────────────────────────────────────────────────
  initSocketIO(httpServer);

  // ── Auth REST routes ─────────────────────────────────────────────────────────
  app.use('/auth', authRouter);

  // ── Internal service-to-service routes ───────────────────────────────────────
  app.use('/internal', internalRouter);

  // ── Health check ─────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: env.SERVICE_NAME,
      graphql: graphqlHandler !== null ? 'ready' : 'starting',
      ts: new Date().toISOString(),
    });
  });

  // ── GraphQL — placeholder until gateway is ready ──────────────────────────────
  // `graphqlHandler` is null until subgraphs come online; swapped in by startGatewayWithRetry.
  let graphqlHandler: RequestHandler | null = null;

  app.use('/graphql', (req: Request, res: Response, next: NextFunction) => {
    if (!graphqlHandler) {
      res.status(503).json({
        error: 'GraphQL gateway is starting',
        detail: 'Subgraph services are not running yet. Start them and the gateway will auto-connect.',
      });
      return;
    }
    graphqlHandler(req, res, next);
  });

  // ── Start HTTP server immediately ─────────────────────────────────────────────
  httpServer.listen(env.PORT, () => {
    console.log(`\n  QueenSkiilia Main Server`);
    console.log(`   GraphQL Gateway : http://localhost:${env.PORT}/graphql`);
    console.log(`   Auth REST       : http://localhost:${env.PORT}/auth`);
    console.log(`   Socket.IO       : ws://localhost:${env.PORT}`);
    console.log(`   Health          : http://localhost:${env.PORT}/health`);
    console.log(`   Environment     : ${env.NODE_ENV}`);
    console.log(`   [Gateway] Waiting for subgraph services...\n`);
  });

  // ── Connect gateway in background — non-blocking ─────────────────────────────
  startGatewayWithRetry((middleware) => {
    graphqlHandler = middleware;
  }).catch((err) => {
    console.error('[Gateway] Unexpected error in retry loop:', err);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
