# Super Admin Service — Python (FastAPI)

## Purpose

The Super Admin service is the **platform control centre**. It combines:
1. **Telemetry Dashboard** — live and historical performance data from the Logging DB across all microservices
2. **Platform Administration** — user management, dispute resolution, verification review, fraud flags
3. **System Health** — service heartbeats, error rates, slow query alerts

This is separate from the regular Admin Service (port 8000) which handles dispute resolution UI for platform moderators. The Super Admin is for the platform owner/engineering team only.

**Port:** 8001

---

## Directory Structure

```
super-admin-service/
├── app/
│   ├── main.py                        # FastAPI app + router registration
│   ├── routers/
│   │   ├── telemetry.py               # Performance & log endpoints
│   │   ├── services.py                # Service health & heartbeats
│   │   ├── users.py                   # Platform user management
│   │   ├── disputes.py                # Dispute management
│   │   ├── verifications.py           # Identity verification review
│   │   └── analytics.py               # Revenue, signups, project stats
│   ├── core/
│   │   ├── logging_db.py              # Logging DB connection (reads telemetry tables)
│   │   ├── auth.py                    # Super admin JWT validation
│   │   └── config.py                  # Settings from .env
│   ├── models/
│   │   └── schemas.py                 # Pydantic response models
│   └── services/
│       ├── telemetry_service.py       # Logging DB query logic
│       └── health_service.py          # Heartbeat checks
├── .env
└── requirements.txt
```

---

## Authentication

Super Admin uses its own JWT secret — completely separate from the platform's user JWTs.

```python
# core/auth.py
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from jose import jwt, JWTError

security = HTTPBearer()

def require_super_admin(token=Depends(security)):
    try:
        payload = jwt.decode(
            token.credentials,
            settings.SUPER_ADMIN_JWT_SECRET,
            algorithms=["HS256"]
        )
        if payload.get("role") != "super_admin":
            raise HTTPException(status_code=403, detail="Super admin only")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

---

## Logging Database Connection

```python
# core/logging_db.py
import asyncpg
from .config import settings

async def get_logging_db():
    return await asyncpg.connect(settings.LOGGING_DB_CONNECTION_STRING)

# Or for connection pool (preferred):
async def create_logging_pool():
    return await asyncpg.create_pool(settings.LOGGING_DB_CONNECTION_STRING, min_size=2, max_size=10)
```

---

## Telemetry Endpoints

### GET /telemetry/logs
Returns the most recent telemetry events across all services.

```
GET /telemetry/logs?limit=100&service=user-service&status=error&operationType=mutation
```

```python
# routers/telemetry.py
@router.get("/telemetry/logs")
async def get_logs(limit: int = 100, service: str = None, status: str = None, operation_type: str = None, _=Depends(require_super_admin)):
    query = "SELECT * FROM telemetry_events"
    filters, params = [], []
    if service:
        params.append(service); filters.append(f"service = ${len(params)}")
    if status:
        params.append(status); filters.append(f"status = ${len(params)}")
    if operation_type:
        params.append(operation_type); filters.append(f"operation_type = ${len(params)}")
    if filters:
        query += " WHERE " + " AND ".join(filters)
    query += f" ORDER BY timestamp DESC LIMIT {limit}"
    rows = await db.fetch(query, *params)
    return {"events": [dict(r) for r in rows]}
```

### GET /telemetry/slow-log
Returns operations that exceeded the slow threshold (500ms).

```
GET /telemetry/slow-log?limit=50
```

### GET /telemetry/stats
Aggregated stats per service and per operation.

```
GET /telemetry/stats?service=project-service
```

Response:
```json
{
  "services": [
    {
      "name": "project-service",
      "totalCalls": 14320,
      "errorCount": 43,
      "errorRate": "0.30%",
      "operations": [
        {
          "name": "postProject",
          "totalCalls": 312,
          "errorCount": 2,
          "avgDurationMs": 87.4
        },
        {
          "name": "projects",
          "totalCalls": 9842,
          "errorCount": 0,
          "avgDurationMs": 34.1
        }
      ]
    }
  ]
}
```

```python
@router.get("/telemetry/stats")
async def get_stats(service: str = None, _=Depends(require_super_admin)):
    q = """
      SELECT service, operation_name,
             COUNT(*) AS total_calls,
             COUNT(*) FILTER (WHERE status='error') AS error_count,
             ROUND(AVG(duration_ms)::numeric, 2) AS avg_duration_ms
      FROM telemetry_events
      {where}
      GROUP BY service, operation_name
      ORDER BY total_calls DESC
    """
    where = f"WHERE service = '{service}'" if service else ""
    rows = await db.fetch(q.format(where=where))
    return {"stats": [dict(r) for r in rows]}
```

### GET /telemetry/errors
All recent error events with stack/message info.

```
GET /telemetry/errors?limit=50&service=payment-service
```

---

## Service Health Endpoints

### GET /services/health
Returns live status of all microservices based on `service_heartbeats` table.

```python
@router.get("/services/health")
async def services_health(_=Depends(require_super_admin)):
    rows = await db.fetch("SELECT service, last_seen_at FROM service_heartbeats")
    known = {r['service']: r['last_seen_at'] for r in rows}
    services = ["main-server", "user-service", "project-service", "skills-service",
                "portfolio-service", "payment-service", "paystack-service",
                "notification-service", "email-service", "rating-service",
                "dispute-service", "chat-service", "admin-service"]
    health = []
    for svc in services:
        last = known.get(svc)
        if last:
            age = (datetime.utcnow() - last.replace(tzinfo=None)).total_seconds()
            status = "healthy" if age < 60 else "degraded"
        else:
            age, status = None, "down"
        health.append({"service": svc, "status": status, "lastSeenAt": str(last) if last else None, "ageSeconds": round(age,1) if age else None})
    return {"services": health}
```

Response shape:
```json
{
  "services": [
    { "service": "main-server",      "status": "healthy",  "lastSeenAt": "2026-03-24T10:42:01Z", "ageSeconds": 3.2 },
    { "service": "payment-service",  "status": "healthy",  "lastSeenAt": "2026-03-24T10:41:58Z", "ageSeconds": 6.1 },
    { "service": "skills-service",   "status": "down",     "lastSeenAt": null,                   "ageSeconds": null }
  ]
}
```

---

## Python Telemetry Middleware (for Admin Service calls)

The admin service (port 8000) also emits telemetry. A FastAPI middleware wraps every endpoint:

```python
# middleware/telemetry.py  (used in admin-service AND super-admin-service)
import time, uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class TelemetryMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = None
        error_msg = None
        try:
            response = await call_next(request)
            status = "error" if response.status_code >= 400 else "success"
        except Exception as e:
            status = "error"
            error_msg = str(e)
            raise
        finally:
            duration_ms = round((time.time() - start) * 1000, 2)
            # Fire and forget — never block the request path
            asyncio.create_task(db.execute(
                """INSERT INTO telemetry_events
                   (id, service, operation_type, operation_name, duration_ms, status, error_message, meta, timestamp)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())""",
                str(uuid.uuid4()), settings.SERVICE_NAME, "http",
                f"{request.method} {request.url.path}", duration_ms, status,
                error_msg or (f"HTTP {response.status_code}" if status == "error" else None),
                json.dumps({"statusCode": response.status_code if response else 500}),
            ))
            asyncio.create_task(db.execute(
                """INSERT INTO service_heartbeats (service, last_seen_at)
                   VALUES ($1, NOW())
                   ON CONFLICT (service) DO UPDATE SET last_seen_at = NOW()""",
                settings.SERVICE_NAME,
            ))

        return response
```

Applied in `main.py`:
```python
app.add_middleware(TelemetryMiddleware)
```

---

## Super Admin `.env`

```env
PORT=8001
SERVICE_NAME=super-admin-service

# Logging DB (dedicated Supabase instance — telemetry only)
LOGGING_SUPERBASE_CONNECTION_STRING=

# Super admin JWT (completely separate from platform JWT)
SUPER_ADMIN_JWT_SECRET=super-admin-only-secret-change-in-production

# Supabase (for user/dispute management)
SUPERBASE_PROJECT_URL=https://qmchnooeuskhepbvxofk.supabase.co
SUPERBASE_CONNECTION_STRING=postgresql://postgres:...

# Internal
INTERNAL_SECRET=shared-secret-for-service-to-service-calls
NODE_ENV=development
```

---

## All Endpoints Summary

### Telemetry
```
GET  /telemetry/logs           Recent events (filterable)
GET  /telemetry/slow-log       Operations > 500ms
GET  /telemetry/stats          Per-service, per-operation aggregates
GET  /telemetry/errors         Recent error events
```

### Service Health
```
GET  /services/health          All service heartbeats + status
```

### Platform Admin
```
GET    /users                  List all users
GET    /users/{id}             User detail
POST   /users/{id}/flag        Flag account
POST   /users/{id}/suspend     Suspend account
POST   /users/{id}/unsuspend   Reinstate account

GET    /disputes               All disputes (filterable by status)
GET    /disputes/{id}          Dispute detail
POST   /disputes/{id}/resolve  Resolve dispute

GET    /verifications          Pending verifications
POST   /verifications/{id}/approve
POST   /verifications/{id}/reject

GET    /analytics/overview     Platform-wide stats
GET    /analytics/revenue      Revenue breakdown
GET    /analytics/signups      User growth over time
```

---

## requirements.txt

```
fastapi
uvicorn[standard]
asyncpg
python-jose[cryptography]
supabase
pydantic-settings
httpx
python-dotenv
```
