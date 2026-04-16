from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import auth_router
from app.config import get_settings
from app.db.pools import close_pools, get_logging_pool, get_main_pool
from app.routers import platform, telemetry


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up DB pools on startup
    try:
        await get_logging_pool()
        print("[super-admin] Connected to Logging DB")
    except Exception as e:
        print(f"[super-admin] WARNING: Could not connect to Logging DB: {e}")

    try:
        await get_main_pool()
        print("[super-admin] Connected to Main DB")
    except Exception as e:
        print(f"[super-admin] WARNING: Could not connect to Main DB: {e}")

    yield

    await close_pools()
    print("[super-admin] DB pools closed")


def create_app() -> FastAPI:
    s = get_settings()

    app = FastAPI(
        title="QueenSkiilia Super Admin API",
        description="Internal telemetry & platform management dashboard",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:3001"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router)
    app.include_router(telemetry.router)
    app.include_router(platform.router)

    @app.get("/")
    async def root():
        return {
            "service": s.SERVICE_NAME,
            "status": "ok",
            "endpoints": {
                "health":    "/health",
                "auth":      "/auth/login",
                "platform":  "/platform",
                "telemetry": "/telemetry",
                "docs":      "/docs",
            },
            "routes": {
                "auth": [
                    {"method": "POST", "path": "/auth/login", "description": "Admin login — returns JWT"},
                ],
                "platform": [
                    {"method": "GET",  "path": "/platform/stats",   "description": "Platform-wide statistics"},
                    {"method": "GET",  "path": "/platform/users",   "description": "List all users"},
                    {"method": "GET",  "path": "/platform/projects","description": "List all projects"},
                ],
                "telemetry": [
                    {"method": "GET",  "path": "/telemetry/summary",    "description": "Dashboard summary"},
                    {"method": "GET",  "path": "/telemetry/services",   "description": "Per-service stats"},
                    {"method": "GET",  "path": "/telemetry/events",     "description": "Raw telemetry events"},
                    {"method": "GET",  "path": "/telemetry/heartbeats", "description": "Service heartbeat status"},
                ],
            },
        }

    @app.get("/health")
    async def health():
        return {"status": "ok", "service": s.SERVICE_NAME}

    return app


app = create_app()
