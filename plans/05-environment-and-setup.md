# Environment Variables & Project Setup

## Monorepo Structure

```
queenskiilia-backend/
├── main-server/           # Node.js — Apollo Gateway + Auth + Socket.IO
├── services/
│   ├── user-service/         # Node.js
│   ├── project-service/      # Node.js
│   ├── skills-service/       # Node.js
│   ├── portfolio-service/    # Node.js
│   ├── payment-service/      # Node.js — Stripe (future global)
│   ├── paystack-service/     # Node.js — Paystack (primary, NGN)
│   ├── notification-service/ # Node.js — in-app notifications
│   ├── email-service/        # Node.js — Gmail SMTP transactional email
│   ├── rating-service/       # Node.js
│   ├── dispute-service/      # Node.js
│   └── chat-service/         # Node.js
├── admin-service/            # Python (FastAPI) — moderation
├── super-admin-service/      # Python (FastAPI) — telemetry + system health
├── plans/                    # This folder
└── docker-compose.yml        # Local development orchestration
```

---

## Shared `.env` Variables (all services carry these)

```env
# Supabase
SUPERBASE_PROJECT_URL=https://<your-project-ref>.supabase.co
SUPERBASE_CONNECTION_STRING=postgresql://postgres:<password>@db.<your-project-ref>.supabase.co:5432/postgres
SUPERBASE_DB_PASSWORD=<db_password>
SUPERBASE_POOL_HOST=aws-1-eu-west-1.pooler.supabase.com
SUPERBASE_POOL_PORT=5432
SUPERBASE_POOL_DATABASE=postgres
SUPERBASE_POOL_USER=postgres.<your-project-ref>
SUPERBASE_POOL_MODE=session

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=30d

# Logging DB (dedicated Supabase instance — telemetry & analytics only)
LOGGING_SUPERBASE_PROJECT_URL=
LOGGING_SUPERBASE_CONNECTION_STRING=
LOGGING_SUPERBASE_POOL_HOST=aws-1-eu-west-1.pooler.supabase.com
LOGGING_SUPERBASE_POOL_PORT=5432
LOGGING_SUPERBASE_POOL_DATABASE=postgres
LOGGING_SUPERBASE_POOL_USER=
LOGGING_SUPERBASE_POOL_MODE=session
LOGGING_SUPERBASE_DB_PASSWORD=

# Cloudinary
CLOUDINARY_CLOUD_NAME=rukkiecodes
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MAX_FILE_SIZE=5242880

# Internal service auth
INTERNAL_SECRET=

# Telemetry (set SERVICE_NAME uniquely per service)
SERVICE_NAME=
SLOW_THRESHOLD_MS=500


# App
NODE_ENV=development
LOG_LEVEL=info
PAGINATION_DEFAULT_LIMIT=20
PAGINATION_MAX_LIMIT=100
```

---

## Service-Specific `.env` Additions

### main-server
```env
PORT=4000
SERVICE_NAME=main-server

# Subgraph service URLs
USER_SERVICE_URL=http://localhost:4001/graphql
PROJECT_SERVICE_URL=http://localhost:4002/graphql
SKILLS_SERVICE_URL=http://localhost:4003/graphql
PORTFOLIO_SERVICE_URL=http://localhost:4004/graphql
PAYMENT_SERVICE_URL=http://localhost:4005/graphql
NOTIFICATION_SERVICE_URL=http://localhost:4006/graphql
RATING_SERVICE_URL=http://localhost:4007/graphql
DISPUTE_SERVICE_URL=http://localhost:4008/graphql
CHAT_SERVICE_URL=http://localhost:4009/graphql
PAYSTACK_SERVICE_URL=http://localhost:4010/graphql
EMAIL_SERVICE_URL=http://localhost:4011

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGINS=http://localhost:8000,http://localhost:3000,http://localhost:3001
SOCKET_CORS_ORIGIN=http://localhost:8000
```

### payment-service (Stripe — future global expansion)
```env
PORT=4005
SERVICE_NAME=payment-service
PLATFORM_FEE_PERCENT=12
EMAIL_SERVICE_URL=http://localhost:4011
```

### paystack-service
```env
PORT=4010
SERVICE_NAME=paystack-service
PAYSTACK_LIVE_SECRET_KEY=<your-paystack-live-secret-key>
PAYSTACK_LIVE_PUBLIC_KEY=<your-paystack-live-public-key>
PAYSTACK_TEST_SECRET_KEY=<your-paystack-test-secret-key>
PAYSTACK_TEST_PUBLIC_KEY=<your-paystack-test-public-key>
PAYMENT_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
PLATFORM_FEE_PERCENT=12
EMAIL_SERVICE_URL=http://localhost:4011
```

### email-service
```env
PORT=4011
SERVICE_NAME=email-service

# Gmail SMTP
MAILING_EMAIL=your-email@gmail.com
MAILING_PASSWORD=<your-gmail-app-password>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
EMAIL_FROM=Queen Skilla <rukkiecodes@gmail.com>
EMAIL_RETRY_MAX=3
```

### admin-service (Python)
```env
PORT=8000
SERVICE_NAME=admin-service
ADMIN_JWT_SECRET=
PAYMENT_SERVICE_URL=http://localhost:4005
NOTIFICATION_SERVICE_URL=http://localhost:4006
SUPER_ADMIN_SERVICE_URL=http://localhost:8001
```

### super-admin-service (Python)
```env
PORT=8001
SERVICE_NAME=super-admin-service
SUPER_ADMIN_JWT_SECRET=
# No subgraph URLs needed — reads directly from Logging DB and Supabase
```

---

## Service Ports

| Service | Port | Notes |
|---|---|---|
| Main Server (Gateway) | 4000 | Auth + Socket.IO + Apollo Gateway |
| User Service | 4001 | |
| Project Service | 4002 | |
| Skills Service | 4003 | |
| Portfolio Service | 4004 | |
| Payment Service | 4005 | Stripe (future global) |
| Notification Service | 4006 | In-app only |
| Rating Service | 4007 | |
| Dispute Service | 4008 | |
| Chat Service | 4009 | |
| Paystack Service | 4010 | Primary payment gateway (NGN) |
| Email Service | 4011 | Internal only — Gmail SMTP, no GraphQL |
| Admin Service (Python) | 8000 | Moderation & dispute resolution |
| Super Admin Service (Python) | 8001 | Telemetry dashboard, system health |

---

## docker-compose.yml (Local Dev)

```yaml
version: '3.9'
services:
  main-server:
    build: ./main-server
    ports: ["4000:4000"]
    env_file: ./main-server/.env
    depends_on: [user-service, project-service, skills-service, portfolio-service, payment-service, paystack-service, notification-service, email-service, rating-service, dispute-service, chat-service]

  user-service:
    build: ./services/user-service
    ports: ["4001:4001"]
    env_file: ./services/user-service/.env

  project-service:
    build: ./services/project-service
    ports: ["4002:4002"]
    env_file: ./services/project-service/.env

  skills-service:
    build: ./services/skills-service
    ports: ["4003:4003"]
    env_file: ./services/skills-service/.env

  portfolio-service:
    build: ./services/portfolio-service
    ports: ["4004:4004"]
    env_file: ./services/portfolio-service/.env

  payment-service:
    build: ./services/payment-service
    ports: ["4005:4005"]
    env_file: ./services/payment-service/.env

  notification-service:
    build: ./services/notification-service
    ports: ["4006:4006"]
    env_file: ./services/notification-service/.env

  rating-service:
    build: ./services/rating-service
    ports: ["4007:4007"]
    env_file: ./services/rating-service/.env

  dispute-service:
    build: ./services/dispute-service
    ports: ["4008:4008"]
    env_file: ./services/dispute-service/.env

  chat-service:
    build: ./services/chat-service
    ports: ["4009:4009"]
    env_file: ./services/chat-service/.env

  paystack-service:
    build: ./services/paystack-service
    ports: ["4010:4010"]
    env_file: ./services/paystack-service/.env

  email-service:
    build: ./services/email-service
    ports: ["4011:4011"]
    env_file: ./services/email-service/.env

  admin-service:
    build: ./admin-service
    ports: ["8000:8000"]
    env_file: ./admin-service/.env

  super-admin-service:
    build: ./super-admin-service
    ports: ["8001:8001"]
    env_file: ./super-admin-service/.env
```

---

## Node Service Template

Each Node.js microservice follows this base structure:

```
service-name/
├── src/
│   ├── schema/
│   │   ├── typeDefs.ts      # GraphQL type definitions (subgraph)
│   │   └── resolvers.ts     # Resolvers
│   ├── db/
│   │   └── supabase.ts      # Supabase client init
│   ├── internal/
│   │   └── routes.ts        # Internal HTTP endpoints (for inter-service calls)
│   ├── telemetry/
│   │   ├── index.ts         # emitTelemetry() — writes to Logging DB
│   │   ├── apolloPlugin.ts  # GraphQL query/mutation/field telemetry plugin
│   │   ├── httpMiddleware.ts # Express HTTP telemetry middleware
│   │   └── subscriptionWrapper.ts  # Subscription telemetry wrapper
│   └── index.ts             # Apollo Subgraph server setup
├── .env
├── package.json
└── tsconfig.json
```

Base `index.ts`:
```ts
import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import { typeDefs } from './schema/typeDefs';
import { resolvers } from './schema/resolvers';
import { internalRouter } from './internal/routes';
import { telemetryPlugin } from './telemetry/apolloPlugin';
import { httpTelemetry } from './telemetry/httpMiddleware';

const app = express();
app.use(express.json());
app.use(httpTelemetry);          // telemetry on ALL HTTP routes
app.use('/internal', internalRouter);

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
  plugins: [telemetryPlugin],    // telemetry on ALL resolvers
});

await server.start();
app.use('/graphql', expressMiddleware(server, {
  context: async ({ req }) => ({
    userId: req.headers['x-user-id'],
    userRole: req.headers['x-user-role'],
    userVerified: req.headers['x-user-verified'] === 'true',
  }),
}));

app.listen(process.env.PORT);
```
