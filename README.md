# QueenSkiilia Backend Monorepo

Backend monorepo for QueenSkiilia, built as a federated microservice platform.

## Stack

- Node.js + TypeScript services
- Apollo GraphQL Federation
- Express gateway (main server)
- Socket.IO for real-time features
- Supabase Postgres (main and logging databases)
- Python FastAPI for admin/super-admin services

## Repository Structure

- `main-server/` - API gateway, auth, routing, and socket hub
- `user-service/` - user accounts and profile data
- `project-service/` - project posting and applications
- `skills-service/` - skills and assessments
- `portfolio-service/` - portfolio data management
- `payment-service/` - payment domain logic
- `paystack-service/` - Paystack integration and webhooks
- `notification-service/` - notifications and reminders
- `email-service/` - transactional email delivery
- `rating-service/` - ratings and reviews
- `dispute-service/` - disputes and resolution workflows
- `chat-service/` - project chat and messaging
- `super-admin-service/` - FastAPI telemetry and platform admin endpoints
- `database/` - seed and database helper scripts
- `plans/` - architecture and implementation planning docs

## Getting Started

### 1) Prerequisites

- Node.js 20+
- npm 10+
- Python 3.11+ (for `super-admin-service`)
- Access to configured Supabase projects (main + logging)

### 2) Install Dependencies

Install dependencies per service folder:

```bash
cd main-server && npm install
cd ../user-service && npm install
cd ../project-service && npm install
cd ../skills-service && npm install
cd ../portfolio-service && npm install
cd ../payment-service && npm install
cd ../paystack-service && npm install
cd ../notification-service && npm install
cd ../email-service && npm install
cd ../rating-service && npm install
cd ../dispute-service && npm install
cd ../chat-service && npm install
cd ../database && npm install
```

For Python admin service:

```bash
cd super-admin-service
python -m venv .venv
# Windows
.venv\Scripts\activate
pip install -r requirements.txt
```

### 3) Environment Configuration

Create `.env` files per service and provide required values for:

- Supabase credentials and DB connection strings
- JWT secrets
- internal service secret
- telemetry/logging DB settings
- third-party providers (for example Paystack, Cloudinary, SMTP)

See planning docs in `plans/` for architecture and env expectations.

### 4) Run Services

Run each service in its own terminal:

```bash
cd <service-folder>
npm run dev
```

For super admin service:

```bash
cd super-admin-service
uvicorn app.main:app --reload
```

## Development Notes

- This repository is organized as independent services.
- Each service owns its schema/resolvers and runtime config.
- The gateway in `main-server/` composes GraphQL subgraphs.
- Telemetry events are written to a dedicated logging database.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
