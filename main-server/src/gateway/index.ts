import {
  ApolloGateway,
  IntrospectAndCompose,
  RemoteGraphQLDataSource,
} from '@apollo/gateway';
import { ApolloServer } from '@apollo/server';
import { env } from '../config/env';
import { gatewayTelemetryPlugin } from '../telemetry/gatewayPlugin';

// Forward authenticated user identity to every subgraph via request headers
class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: { request: any; context: any }) {
    if (context?.userId) {
      request.http.headers.set('x-user-id', context.userId);
      request.http.headers.set('x-user-account-type', context.accountType ?? '');
      request.http.headers.set('x-user-verified', String(context.isVerified ?? false));
    }
  }
}

const subgraphs = [
  { name: 'users',         url: env.USER_SERVICE_URL },
  { name: 'projects',      url: env.PROJECT_SERVICE_URL },
  { name: 'skills',        url: env.SKILLS_SERVICE_URL },
  { name: 'portfolio',     url: env.PORTFOLIO_SERVICE_URL },
  { name: 'payments',      url: env.PAYMENT_SERVICE_URL },
  { name: 'paystack',      url: env.PAYSTACK_SERVICE_URL },
  { name: 'notifications', url: env.NOTIFICATION_SERVICE_URL },
  { name: 'ratings',       url: env.RATING_SERVICE_URL },
  { name: 'disputes',      url: env.DISPUTE_SERVICE_URL },
  { name: 'chat',          url: env.CHAT_SERVICE_URL },
];

// Factory — called on every retry attempt because ApolloServer.start()
// can only be called once per instance. A failed start poisons the instance,
// so we must create fresh gateway + server objects on each try.
export function createApolloServer(): ApolloServer {
  const gateway = new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({ subgraphs }),
    buildService({ url }) {
      return new AuthenticatedDataSource({ url });
    },
  });

  return new ApolloServer({
    gateway,
    plugins: [gatewayTelemetryPlugin],
  });
}
