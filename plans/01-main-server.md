# Main Server — Node.js

## Responsibilities

- Apollo Gateway (GraphQL Federation entry point)
- Authentication (Email OTP — passwordless)
- JWT issuance and validation
- Socket.IO hub (manages rooms, delegates real-time events)
- Request forwarding to subgraph microservices
- Rate limiting and basic DDoS protection

---

## Directory Structure

```
main-server/
├── src/
│   ├── gateway/
│   │   └── index.ts           # Apollo Gateway setup, subgraph URLs
│   ├── auth/
│   │   ├── otp.ts             # OTP generation, hash, verify — calls Email Service
│   │   ├── jwt.ts             # Sign and verify JWT tokens
│   │   └── middleware.ts      # Express/GraphQL auth middleware
│   ├── socket/
│   │   ├── index.ts           # Socket.IO server setup
│   │   └── rooms.ts           # Room management (user:<id>, project:<id>)
│   ├── internal/
│   │   └── emailClient.ts     # HTTP client to call Email Service /internal/send
│   ├── middleware/
│   │   ├── rateLimit.ts       # express-rate-limit config
│   │   └── context.ts         # GraphQL context builder (injects user from JWT)
│   └── index.ts               # App entry point
├── .env
└── package.json
```

---

## Authentication Flow — Passwordless Email OTP

### Step 1: Request OTP
```
Mutation: requestOTP(email: String!, accountType: AccountType!)
```
1. Validate email format
2. Check if user exists in Supabase `users` table
   - If not: create a pending user record with `account_type` and `verified: false`
3. Generate a 6-digit OTP, hash it, store in `otp_tokens` table with a 10-minute expiry
4. Call **Email Service** `POST /internal/send` with template `otp` — Email Service handles delivery
5. Return: `{ message: "OTP sent" }`

### Step 2: Verify OTP
```
Mutation: verifyOTP(email: String!, otp: String!)
```
1. Look up the latest un-used OTP for this email in `otp_tokens`
2. Check: not expired, not already used, hash matches
3. Mark OTP as used
4. If user is new → mark `email_verified: true`
5. Issue a signed JWT:
   ```json
   {
     "sub": "<user_id>",
     "email": "<email>",
     "account_type": "student | business",
     "verified": false,
     "iat": ...,
     "exp": ...
   }
   ```
6. Return: `{ token, user }`

### JWT Structure
- **Access Token** — 15 minutes (passed in `Authorization` header for every request)
- **Refresh Token** — 30 days (stored in Supabase `refresh_tokens` table, sent via HttpOnly cookie)
- Gateway middleware decodes access token and injects user into GraphQL context

---

## Socket.IO Hub

The main server runs Socket.IO on the same port as the HTTP/GraphQL server.

### Connection
- Client connects with JWT: `io.connect(url, { auth: { token } })`
- On connection: verify JWT, attach `socket.data.userId`
- Auto-join rooms: `user:<userId>` for personal notifications

### Room Joining
- When a user opens a project: `socket.join("project:<projectId>")`
- When a user opens a chat: `socket.join("chat:<chatId>")`

### Events

| Event | Direction | Description |
|---|---|---|
| `notification:new` | Server → Client | New notification for user |
| `project:update` | Server → Client | Project status changed |
| `chat:message` | Bidirectional | New chat message in project |
| `chat:typing` | Bidirectional | Typing indicator |
| `escrow:released` | Server → Client | Payment released |
| `deadline:reminder` | Server → Client | Project deadline approaching |

### Emitting from Microservices
Each microservice can emit Socket.IO events by calling the main server's internal **event endpoint**:
```
POST /internal/emit
Body: { room, event, data }
Header: X-Internal-Secret: <shared_secret>
```
The main server emits the event to the specified Socket.IO room.

---

## GraphQL Gateway Setup

Using **Apollo Federation v2** — the gateway stitches schemas from all subgraph services.

```ts
// gateway/index.ts
const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: "users",         url: process.env.USER_SERVICE_URL },
      { name: "projects",      url: process.env.PROJECT_SERVICE_URL },
      { name: "skills",        url: process.env.SKILLS_SERVICE_URL },
      { name: "portfolio",     url: process.env.PORTFOLIO_SERVICE_URL },
      { name: "payments",      url: process.env.PAYMENT_SERVICE_URL },
      { name: "notifications", url: process.env.NOTIFICATION_SERVICE_URL },
      { name: "ratings",       url: process.env.RATING_SERVICE_URL },
      { name: "disputes",      url: process.env.DISPUTE_SERVICE_URL },
      { name: "chat",          url: process.env.CHAT_SERVICE_URL },
    ],
  }),
});
```

The gateway passes `user` (decoded from JWT) in the GraphQL context to all subgraphs via HTTP headers: `x-user-id`, `x-user-role`, `x-user-verified`.

---

## Security Measures (Phase 1)

- Rate limiting on `/auth` routes: 5 OTP requests per IP per 15 minutes
- OTP is hashed (bcrypt) before storage — never stored in plain text
- JWT secret rotated via environment variable
- All internal service-to-service calls require `X-Internal-Secret` header
- CORS configured to allow only known client origins
