from pydantic import BaseModel
from typing import Any


class ServiceHeartbeat(BaseModel):
    service: str
    last_seen_at: str
    updated_at: str
    is_online: bool          # True if last_seen_at < 2 minutes ago


class TelemetryEvent(BaseModel):
    id: str
    service: str
    operation_type: str
    operation_name: str
    resolver_path: str | None
    user_id: str | None
    duration_ms: float
    status: str
    error_message: str | None
    error_code: str | None
    meta: Any
    timestamp: str


class ServiceStats(BaseModel):
    service: str
    total_requests: int
    error_count: int
    error_rate: float           # 0.0 – 1.0
    avg_duration_ms: float
    p95_duration_ms: float
    slow_requests: int          # above threshold
    period_hours: int


class OperationStats(BaseModel):
    operation_name: str
    operation_type: str
    service: str
    call_count: int
    error_count: int
    avg_duration_ms: float
    p95_duration_ms: float


class DashboardSummary(BaseModel):
    services_online: int
    services_total: int
    total_requests_1h: int
    error_rate_1h: float
    avg_duration_ms_1h: float
    slowest_operations: list[OperationStats]
    most_erroring_operations: list[OperationStats]
    heartbeats: list[ServiceHeartbeat]
