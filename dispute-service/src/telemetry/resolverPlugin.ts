import type { ApolloServerPlugin, GraphQLRequestContext } from '@apollo/server';
import { emitTelemetry } from './index';

// Per-resolver telemetry — wraps every field resolution in this subgraph.
export const resolverTelemetryPlugin: ApolloServerPlugin = {
  async requestDidStart(requestContext: GraphQLRequestContext<Record<string, unknown>>) {
    const operationStart = Date.now();

    return {
      async willSendResponse() {
        const body = requestContext.response?.body as any;
        const errors = body?.singleResult?.errors;
        const hasErrors = Array.isArray(errors) && errors.length > 0;

        const operationType =
          (requestContext.operation?.operation as string) ?? 'query';

        const operationName =
          requestContext.request.operationName ??
          (requestContext.operation?.selectionSet.selections[0] as any)?.name?.value ??
          'anonymous';

        emitTelemetry({
          operationType: operationType as any,
          operationName: String(operationName),
          userId: (requestContext.contextValue as any)?.userId,
          durationMs: Date.now() - operationStart,
          status: hasErrors ? 'error' : 'success',
          errorMessage: hasErrors ? errors[0]?.message    : undefined,
          errorCode:    hasErrors ? errors[0]?.extensions?.code : undefined,
        });
      },
    };
  },
};
