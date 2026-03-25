# Admin Service — Python (FastAPI)

## Responsibilities

- Internal admin dashboard API (not exposed to regular users)
- Dispute review and resolution
- User verification review (approve/reject ID documents)
- Account flagging and suspension
- Fraud detection hooks (Phase 1: rule-based; Phase 2: AI/ML)
- Platform analytics and reporting

---

## Directory Structure

```
admin-service/
├── app/
│   ├── main.py                  # FastAPI app entry point
│   ├── routers/
│   │   ├── disputes.py          # Dispute review endpoints
│   │   ├── verifications.py     # User verification review
│   │   ├── users.py             # User management (flag, suspend)
│   │   ├── analytics.py         # Platform stats
│   │   └── fraud.py             # Fraud detection rules
│   ├── db/
│   │   └── supabase_client.py   # Supabase Python client
│   ├── models/
│   │   └── schemas.py           # Pydantic models
│   ├── services/
│   │   ├── dispute_service.py
│   │   ├── fraud_service.py
│   │   └── notification_service.py  # Call Node notification service
│   └── middleware/
│       └── admin_auth.py        # Admin JWT validation
├── .env
└── requirements.txt
```

---

## Authentication

Admin endpoints are protected by a separate **admin JWT** (issued only to platform admins).

```python
# middleware/admin_auth.py
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer

security = HTTPBearer()

def require_admin(token = Depends(security)):
    payload = verify_jwt(token.credentials)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload
```

---

## Key Endpoints

### Disputes

```
GET    /admin/disputes                  List all disputes (filter by status)
GET    /admin/disputes/{id}             Dispute detail + project + evidence
POST   /admin/disputes/{id}/resolve     Resolve dispute
  Body: { resolution: "release_to_student" | "refund_to_business" | "split", admin_note: str }
```

Resolution logic:
1. Update `disputes` table (`status: resolved`, `resolution`, `admin_note`, `resolved_at`)
2. Call Payment Service internal endpoint to execute the resolution (release / refund)
3. Notify both parties via Notification Service internal endpoint

### Verifications

```
GET    /admin/verifications             List pending verifications
GET    /admin/verifications/{id}        View document (Cloudinary URL)
POST   /admin/verifications/{id}/approve
POST   /admin/verifications/{id}/reject
  Body: { admin_note: str }
```

On approval of all required steps → mark `users.is_verified = true`, set `verified_badge`.

### User Management

```
GET    /admin/users                     List users (filter, search, paginate)
GET    /admin/users/{id}               User detail
POST   /admin/users/{id}/flag          Flag account for review
POST   /admin/users/{id}/suspend       Suspend account
POST   /admin/users/{id}/unsuspend     Reinstate account
```

### Analytics

```
GET    /admin/analytics/overview        Total users, projects, revenue, disputes
GET    /admin/analytics/revenue         Revenue breakdown by date range
GET    /admin/analytics/top-talent      Top performing students
GET    /admin/analytics/disputes        Dispute rate and resolution stats
```

### Fraud Detection (Phase 1 — Rule-Based)

```
POST   /admin/fraud/scan-submission     Scan submission for plagiarism signals
POST   /admin/fraud/check-user          Check user account for bot/fake signals
```

#### Rule-Based Fraud Signals (Phase 1)
- Multiple accounts from same IP → flag
- OTP requested too many times in short window → block
- Submission files identical to a previous submission → flag plagiarism
- Account created and immediately posting/applying at high volume → flag as bot

---

## Internal Communication

The admin service communicates with Node microservices via internal HTTP:

```python
import httpx

async def trigger_payment_release(escrow_id: str, resolution: str):
    async with httpx.AsyncClient() as client:
        await client.post(
            f"{PAYMENT_SERVICE_URL}/internal/resolve-escrow",
            json={"escrow_id": escrow_id, "resolution": resolution},
            headers={"X-Internal-Secret": INTERNAL_SECRET}
        )

async def send_notification(user_id: str, type: str, title: str, body: str, metadata: dict):
    async with httpx.AsyncClient() as client:
        await client.post(
            f"{NOTIFICATION_SERVICE_URL}/internal/notify",
            json={"user_id": user_id, "type": type, "title": title, "body": body, "metadata": metadata},
            headers={"X-Internal-Secret": INTERNAL_SECRET}
        )
```

---

## Requirements

```
fastapi
uvicorn
supabase
pydantic
python-dotenv
httpx
python-jose       # JWT verification
bcrypt
```
