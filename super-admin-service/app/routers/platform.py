from typing import Annotated
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.auth import get_current_admin
from app.db.pools import get_main_pool

router = APIRouter(prefix="/platform", tags=["platform"])
Admin = Annotated[str, Depends(get_current_admin)]


class PlatformStats(BaseModel):
    total_users: int
    students: int
    businesses: int
    verified_users: int
    flagged_users: int
    total_projects: int
    open_projects: int
    in_progress_projects: int
    completed_projects: int
    disputed_projects: int
    total_escrow_value: float
    held_escrow_value: float


class UserRow(BaseModel):
    id: str
    email: str
    account_type: str
    full_name: str | None
    country: str | None
    is_verified: bool
    is_flagged: bool
    is_active: bool
    created_at: str


class ProjectRow(BaseModel):
    id: str
    title: str
    business_id: str
    status: str
    budget: float
    currency: str
    created_at: str


@router.get("/stats", response_model=PlatformStats)
async def platform_stats(_admin: Admin):
    """High-level platform health numbers."""
    pool = await get_main_pool()
    async with pool.acquire() as conn:
        u = await conn.fetchrow(
            """
            SELECT
                COUNT(*)                                          AS total,
                COUNT(*) FILTER (WHERE account_type = 'student') AS students,
                COUNT(*) FILTER (WHERE account_type = 'business')AS businesses,
                COUNT(*) FILTER (WHERE is_verified = TRUE)       AS verified,
                COUNT(*) FILTER (WHERE is_flagged = TRUE)        AS flagged
            FROM users
            """
        )
        p = await conn.fetchrow(
            """
            SELECT
                COUNT(*)                                               AS total,
                COUNT(*) FILTER (WHERE status = 'open')               AS open,
                COUNT(*) FILTER (WHERE status = 'in_progress')        AS in_progress,
                COUNT(*) FILTER (WHERE status = 'completed')          AS completed,
                COUNT(*) FILTER (WHERE status = 'disputed')           AS disputed
            FROM projects
            """
        )
        e = await conn.fetchrow(
            """
            SELECT
                COALESCE(SUM(amount), 0)                               AS total_value,
                COALESCE(SUM(amount) FILTER (WHERE status = 'held'), 0)AS held_value
            FROM escrow_accounts
            """
        )

    return PlatformStats(
        total_users=u["total"],
        students=u["students"],
        businesses=u["businesses"],
        verified_users=u["verified"],
        flagged_users=u["flagged"],
        total_projects=p["total"],
        open_projects=p["open"],
        in_progress_projects=p["in_progress"],
        completed_projects=p["completed"],
        disputed_projects=p["disputed"],
        total_escrow_value=float(e["total_value"]),
        held_escrow_value=float(e["held_value"]),
    )


@router.get("/users", response_model=list[UserRow])
async def list_users(
    _admin: Admin,
    account_type: str | None = None,
    is_flagged: bool | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    """Paginated user list with optional filters."""
    pool = await get_main_pool()
    conditions = ["TRUE"]
    params: list = []
    idx = 1

    if account_type:
        conditions.append(f"account_type = ${idx}")
        params.append(account_type); idx += 1
    if is_flagged is not None:
        conditions.append(f"is_flagged = ${idx}")
        params.append(is_flagged); idx += 1

    where = " AND ".join(conditions)
    params += [limit, offset]

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""
            SELECT id, email, account_type, full_name, country,
                   is_verified, is_flagged, is_active, created_at
            FROM users
            WHERE {where}
            ORDER BY created_at DESC
            LIMIT ${idx} OFFSET ${idx+1}
            """,
            *params,
        )

    return [
        UserRow(
            id=str(r["id"]),
            email=r["email"],
            account_type=r["account_type"],
            full_name=r["full_name"],
            country=r["country"],
            is_verified=r["is_verified"],
            is_flagged=r["is_flagged"],
            is_active=r["is_active"],
            created_at=r["created_at"].isoformat(),
        )
        for r in rows
    ]


@router.post("/users/{user_id}/flag")
async def flag_user(user_id: str, _admin: Admin):
    """Flag a user account for review."""
    pool = await get_main_pool()
    async with pool.acquire() as conn:
        result = await conn.execute(
            "UPDATE users SET is_flagged = TRUE, updated_at = NOW() WHERE id = $1",
            user_id,
        )
    updated = int(result.split()[-1])
    return {"ok": updated > 0, "user_id": user_id, "action": "flagged"}


@router.post("/users/{user_id}/unflag")
async def unflag_user(user_id: str, _admin: Admin):
    """Remove flag from a user account."""
    pool = await get_main_pool()
    async with pool.acquire() as conn:
        result = await conn.execute(
            "UPDATE users SET is_flagged = FALSE, updated_at = NOW() WHERE id = $1",
            user_id,
        )
    updated = int(result.split()[-1])
    return {"ok": updated > 0, "user_id": user_id, "action": "unflagged"}


@router.post("/users/{user_id}/suspend")
async def suspend_user(user_id: str, _admin: Admin):
    """Deactivate a user account."""
    pool = await get_main_pool()
    async with pool.acquire() as conn:
        result = await conn.execute(
            "UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1",
            user_id,
        )
    updated = int(result.split()[-1])
    return {"ok": updated > 0, "user_id": user_id, "action": "suspended"}


@router.get("/projects", response_model=list[ProjectRow])
async def list_projects(
    _admin: Admin,
    status: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    """Paginated project list."""
    pool = await get_main_pool()
    conditions = ["TRUE"]
    params: list = []
    idx = 1

    if status:
        conditions.append(f"status = ${idx}")
        params.append(status); idx += 1

    params += [limit, offset]

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""
            SELECT id, title, business_id, status, budget, currency, created_at
            FROM projects
            WHERE {" AND ".join(conditions)}
            ORDER BY created_at DESC
            LIMIT ${idx} OFFSET ${idx+1}
            """,
            *params,
        )

    return [
        ProjectRow(
            id=str(r["id"]),
            title=r["title"],
            business_id=str(r["business_id"]),
            status=r["status"],
            budget=float(r["budget"]),
            currency=r["currency"],
            created_at=r["created_at"].isoformat(),
        )
        for r in rows
    ]
