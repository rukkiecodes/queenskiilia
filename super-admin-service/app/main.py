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

    @app.get("/health")
    async def health():
        return {"status": "ok", "service": s.SERVICE_NAME}

    return app


app = create_app()
