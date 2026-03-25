# QueenSkiilia — Backend Architecture Overview

## Tech Stack

| Layer | Technology |
|---|---|
| Main Server | Node.js + Express |
| API Layer | GraphQL (Apollo Server) |
| Real-time | Socket.IO |
| Database | Supabase (PostgreSQL) |
| Admin Service | Python (FastAPI) |
| Image Storage | Cloudinary |
| Auth | Passwordless Email OTP (phase 1) |
| Email Delivery | Gmail SMTP (via dedicated Email Service) |
| Payments | Paystack (primary) |
| Telemetry Store | Supabase Logging DB (dedicated Postgres instance) |
| Super Admin | Python (FastAPI) — reads telemetry from Logging DB |

---

## Architecture Pattern: Federated Microservices

The backend is split into independent microservices. Each service:
- Owns a slice of the GraphQL schema (schema federation via Apollo Federation)
- Connects to the **same Supabase database** with its own scoped queries
- Maintains its **own copy of `.env`** with shared environment variables
- Runs as its own process/container

The **Main Server** acts as the **Apollo Gateway** — it stitches all subgraph schemas together and handles all authentication. Every request passes through the main server first.

---

## Services Map

```
Client (Web / Mobile)
        |
        v
[ Main Server — Node.js ]
  ├── Apollo Gateway (GraphQL Federation)
  ├── Auth (Email OTP / JWT)
  ├── Socket.IO Hub (delegates to services)
  └── Routes all authenticated requests to subgraphs
        |
        ├──> [ User Service ]         — profiles, verification, badges
        ├──> [ Project Service ]      — marketplace, posting, applications
        ├──> [ Skills Service ]       — assessments, categories, matching
        ├──> [ Portfolio Service ]    — auto-generated portfolios
        ├──> [ Payment Service ]      — Stripe escrow (future global expansion)
        ├──> [ Paystack Service ]     — Paystack escrow & releases (primary payment gateway)
        ├──> [ Notification Service ] — in-app alerts, deadlines, reminders
        ├──> [ Email Service ]        — transactional email via Gmail SMTP (OTP, alerts, receipts)
        ├──> [ Rating Service ]       — reviews, leaderboards
        ├──> [ Dispute Service ]      — dispute raising & resolution
        ├──> [ Chat Service ]         — project messaging (Socket.IO)
        ├──> [ Admin Service ]        — Python/FastAPI, dispute management, moderation
        └──> [ Super Admin Service ]  — Python/FastAPI, telemetry dashboard, system health

Every service emits telemetry → Logging DB (Postgres)
Super Admin reads Logging DB → live performance dashboard
```

### Telemetry Flow
```
Any service (resolver/controller/webhook)
        |
        v
[ Telemetry Middleware ]
  ├── Captures: operation name, type, duration, status, userId, errors
  └── Writes to: Logging DB (Postgres) via Postgres INSERT (async, fire-and-forget)
        |
        v
[ Super Admin Service ]
  ├── GET /telemetry/logs      — query recent events
  ├── GET /telemetry/stats     — aggregated per-service stats
  ├── GET /telemetry/slow-log  — slow queries
  └── GET /services/health     — heartbeat status of all services
```

---

## Shared Environment Variables

Both the main server and each microservice carry their own `.env` file containing only what they need. The following variables are shared across all services:

```env
# Supabase
SUPERBASE_PROJECT_URL=
SUPERBASE_CONNECTION_STRING=
SUPERBASE_DB_PASSWORD=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=

# Logging DB (dedicated Supabase instance — telemetry only)
LOGGING_SUPERBASE_CONNECTION_STRING=
LOGGING_SUPERBASE_POOL_USER=
LOGGING_SUPERBASE_DB_PASSWORD=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Internal service auth
INTERNAL_SECRET=

# Telemetry
SERVICE_NAME=          # unique per service
SLOW_THRESHOLD_MS=500

# App
NODE_ENV=
PORT=
```

Services add their own variables (e.g., `PAYSTACK_LIVE_SECRET_KEY` only in Paystack Service).

---

## Request Flow

1. Client sends GraphQL query/mutation → **Main Server (Gateway)**
2. Gateway validates JWT from the `Authorization: Bearer <token>` header
3. Gateway forwards the request with the decoded user identity to the appropriate **subgraph service**
4. Subgraph service executes query against **Supabase**
5. Response is merged and returned to the client

Real-time events (Socket.IO) are emitted from any service back through the **Main Server's Socket.IO hub**, which broadcasts to connected clients by room (user ID / project ID).

---

## Phase 1 Scope

For the initial build, we focus on:
- Passwordless login (email OTP via Email Service)
- Student & Business account types
- Project marketplace (post, browse, apply)
- Skill assessment (manual category selection first, AI layer later)
- Basic escrow payment flow — Stripe (USD) + Paystack (NGN)
- Real-time in-app notifications & project chat
- Transactional emails via dedicated Email Service
- Ratings after project completion
- Auto-portfolio generation from approved projects
- Admin service (dispute management, user moderation)
