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
import { buildContext } from './context';
import { resolverTelemetryPlugin } from './telemetry/resolverPlugin';

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

  app.get('/', (_req, res) => {
    res.json({
      service: env.SERVICE_NAME,
      status: 'ok',
      endpoints: { graphql: '/graphql', health: '/health' },
      graphql: {
        queries:   ['chat', 'chatMessages'],
        mutations: ['sendMessage', 'markMessagesRead'],
      },
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
