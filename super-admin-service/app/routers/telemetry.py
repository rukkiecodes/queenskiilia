from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.auth import get_current_admin
from app.db.pools import get_logging_pool
from app.models.telemetry import (
    DashboardSummary,
    OperationStats,
    ServiceHeartbeat,
    ServiceStats,
    TelemetryEvent,
)

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

Admin = Annotated[str, Depends(get_current_admin)]

ONLINE_THRESHOLD_SECONDS = 120  # service considered offline after 2 min silence


# ── Helpers ───────────────────────────────────────────────────────────────────

def _is_online(last_seen_at: datetime) -> bool:
    now = datetime.now(timezone.utc)
    delta = (now - last_seen_at.replace(tzinfo=timezone.utc)).total_seconds()
    return delta < ONLINE_THRESHOLD_SECONDS


def _row_to_heartbeat(row: dict) -> ServiceHeartbeat:
    return ServiceHeartbeat(
        service=row["service"],
        last_seen_at=row["last_seen_at"].isoformat(),
        updated_at=row["updated_at"].isoformat(),
        is_online=_is_online(row["last_seen_at"]),
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=DashboardSummary)
async def dashboard(_admin: Admin):
    """Main super-admin dashboard — live stats for the last hour."""
    pool = await get_logging_pool()
    async with pool.acquire() as conn:
        # Heartbeats
        hb_rows = await conn.fetch(
            "SELECT * FROM service_heartbeats ORDER BY service"
        )
        heartbeats = [_row_to_heartbeat(dict(r)) for r in hb_rows]
        services_online = sum(1 for h in heartbeats if h.is_online)

        # Aggregate last hour
        agg = await conn.fetchrow(
            """
            SELECT
                COUNT(*)                            AS total,
                COUNT(*) FILTER (WHERE status = 'error') AS errors,
                AVG(duration_ms)                    AS avg_ms
            FROM telemetry_events
            WHERE timestamp > NOW() - INTERVAL '1 hour'
            """
        )
        total_1h  = agg["total"] or 0
        errors_1h = agg["errors"] or 0
        avg_ms_1h = float(agg["avg_ms"] or 0)
        error_rate = (errors_1h / total_1h) if total_1h else 0.0

        # Slowest operations
        slow_rows = await conn.fetch(
            """
            SELECT
                operation_name,
                operation_type,
                service,
                COUNT(*)                AS call_count,
                COUNT(*) FILTER (WHERE status = 'error') AS error_count,
                AVG(duration_ms)        AS avg_ms,
                PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_ms
            FROM telemetry_events
            WHERE timestamp > NOW() - INTERVAL '1 hour'
            GROUP BY operation_name, operation_type, service
            ORDER BY avg_ms DESC
            LIMIT 5
            """
        )

        # Most erroring operations
        error_rows = await conn.fetch(
            """
            SELECT
                operation_name,
                operation_type,
                service,
                COUNT(*)                AS call_count,
                COUNT(*) FILTER (WHERE status = 'error') AS error_count,
                AVG(duration_ms)        AS avg_ms,
                PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_ms
            FROM telemetry_events
            WHERE timestamp > NOW() - INTERVAL '1 hour'
              AND status = 'error'
            GROUP BY operation_name, operation_type, service
            ORDER BY error_count DESC
            LIMIT 5
            """
        )

    def to_op(row: dict) -> OperationStats:
        return OperationStats(
            operation_name=row["operation_name"],
            operation_type=row["operation_type"],
            service=row["service"],
            call_count=row["call_count"],
            error_count=row["error_count"],
            avg_duration_ms=float(row["avg_ms"] or 0),
            p95_duration_ms=float(row["p95_ms"] or 0),
        )

    return DashboardSummary(
        services_online=services_online,
        services_total=len(heartbeats),
        total_requests_1h=total_1h,
        error_rate_1h=round(error_rate, 4),
        avg_duration_ms_1h=round(avg_ms_1h, 2),
        slowest_operations=[to_op(dict(r)) for r in slow_rows],
        most_erroring_operations=[to_op(dict(r)) for r in error_rows],
        heartbeats=heartbeats,
    )


@router.get("/heartbeats", response_model=list[ServiceHeartbeat])
async def heartbeats(_admin: Admin):
    """Live service heartbeat status."""
    pool = await get_logging_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM service_heartbeats ORDER BY service")
    return [_row_to_heartbeat(dict(r)) for r in rows]


@router.get("/service/{service}", response_model=ServiceStats)
async def service_stats(
    service: str,
    _admin: Admin,
    hours: int = Query(default=24, ge=1, le=168),
    slow_threshold_ms: float = Query(default=500),
):
    """Detailed stats for a single service over the past N hours."""
    pool = await get_logging_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT
                COUNT(*)                                                AS total,
                COUNT(*) FILTER (WHERE status = 'error')               AS errors,
                AVG(duration_ms)                                        AS avg_ms,
                PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_ms,
                COUNT(*) FILTER (WHERE duration_ms > $3)               AS slow
            FROM telemetry_events
            WHERE service = $1
              AND timestamp > NOW() - ($2 || ' hours')::INTERVAL
            """,
            service, hours, slow_threshold_ms,
        )
    total  = row["total"] or 0
    errors = row["errors"] or 0
    return ServiceStats(
        service=service,
        total_requests=total,
        error_count=errors,
        error_rate=round((errors / total) if total else 0.0, 4),
        avg_duration_ms=round(float(row["avg_ms"] or 0), 2),
        p95_duration_ms=round(float(row["p95_ms"] or 0), 2),
        slow_requests=row["slow"] or 0,
        period_hours=hours,
    )


@router.get("/events", response_model=list[TelemetryEvent])
async def recent_events(
    _admin: Admin,
    service: str | None = None,
    status: str | None = None,
    operation_type: str | None = None,
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
):
    """Paginated raw telemetry event log with optional filters."""
    pool = await get_logging_pool()
    conditions = ["TRUE"]
    params: list = []
    idx = 1

    if service:
        conditions.append(f"service = ${idx}")
        params.append(service); idx += 1
    if status:
        conditions.append(f"status = ${idx}")
        params.append(status); idx += 1
    if operation_type:
        conditions.append(f"operation_type = ${idx}")
        params.append(operation_type); idx += 1

    where = " AND ".join(conditions)
    params += [limit, offset]

    async with (await get_logging_pool()).acquire() as conn:
        rows = await conn.fetch(
            f"""
            SELECT * FROM telemetry_events
            WHERE {where}
            ORDER BY timestamp DESC
            LIMIT ${idx} OFFSET ${idx+1}
            """,
            *params,
        )

    return [
        TelemetryEvent(
            id=str(r["id"]),
            service=r["service"],
            operation_type=r["operation_type"],
            operation_name=r["operation_name"],
            resolver_path=r["resolver_path"],
            user_id=r["user_id"],
            duration_ms=float(r["duration_ms"]),
            status=r["status"],
            error_message=r["error_message"],
            error_code=r["error_code"],
            meta=r["meta"],
            timestamp=r["timestamp"].isoformat(),
        )
        for r in rows
    ]


@router.get("/slow-operations", response_model=list[OperationStats])
async def slow_operations(
    _admin: Admin,
    hours: int = Query(default=1, ge=1, le=24),
    limit: int = Query(default=20, ge=1, le=100),
):
    """Top slowest operations by average duration."""
    pool = await get_logging_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT
                operation_name,
                operation_type,
                service,
                COUNT(*)                                                   AS call_count,
                COUNT(*) FILTER (WHERE status = 'error')                   AS error_count,
                AVG(duration_ms)                                           AS avg_ms,
                PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)  AS p95_ms
            FROM telemetry_events
            WHERE timestamp > NOW() - ($1 || ' hours')::INTERVAL
            GROUP BY operation_name, operation_type, service
            ORDER BY avg_ms DESC
            LIMIT $2
            """,
            hours, limit,
        )
    return [
        OperationStats(
            operation_name=r["operation_name"],
            operation_type=r["operation_type"],
            service=r["service"],
            call_count=r["call_count"],
            error_count=r["error_count"],
            avg_duration_ms=round(float(r["avg_ms"] or 0), 2),
            p95_duration_ms=round(float(r["p95_ms"] or 0), 2),
        )
        for r in rows
    ]
