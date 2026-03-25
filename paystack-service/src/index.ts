import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { expressMiddleware } from '@apollo/server/express4';
import { env } from './config/env';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { resolverTelemetryPlugin } from './telemetry/resolverPlugin';
import { webhookRouter } from './webhook';

async function bootstrap() {
  const app        = express();
  const httpServer = http.createServer(app);

  // Webhook must use raw body — mount before express.json()
  app.use('/webhook/paystack', express.raw({ type: 'application/json' }), (req, _res, next) => {
    if (Buffer.isBuffer(req.body)) {
      req.body = JSON.parse(req.body.toString());
    }
    next();
  }, webhookRouter);

  app.use(cors());
  app.use(express.json());

  const server = new ApolloServer({
    schema:  buildSubgraphSchema({ typeDefs, resolvers }),
    plugins: [resolverTelemetryPlugin],
  });
  await server.start();

  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }) => ({
      userId:      req.headers['x-user-id'] as string | undefined,
      accountType: req.headers['x-user-account-type'] as string | undefined,
      isVerified:  req.headers['x-user-verified'] === 'true',
    }),
  }));

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: env.SERVICE_NAME }));

  httpServer.listen(env.PORT, () => {
    console.log(`\n  [${env.SERVICE_NAME}] Running on http://localhost:${env.PORT}/graphql\n`);
    console.log(`  Webhook: http://localhost:${env.PORT}/webhook/paystack\n`);
  });
}

bootstrap().catch((err) => { console.error('Fatal:', err); process.exit(1); });
