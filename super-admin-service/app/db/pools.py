import asyncpg
from app.config import get_settings

_logging_pool: asyncpg.Pool | None = None
_main_pool: asyncpg.Pool | None = None


async def get_logging_pool() -> asyncpg.Pool:
    global _logging_pool
    if _logging_pool is None:
        s = get_settings()
        _logging_pool = await asyncpg.create_pool(
            host=s.LOGGING_SUPERBASE_POOL_HOST,
            port=s.LOGGING_SUPERBASE_POOL_PORT,
            database=s.LOGGING_SUPERBASE_POOL_DATABASE,
            user=s.LOGGING_SUPERBASE_POOL_USER,
            password=s.LOGGING_SUPERBASE_DB_PASSWORD,
            min_size=1,
            max_size=5,
            ssl="require",
        )
    return _logging_pool


async def get_main_pool() -> asyncpg.Pool:
    global _main_pool
    if _main_pool is None:
        s = get_settings()
        _main_pool = await asyncpg.create_pool(
            host=s.SUPERBASE_POOL_HOST,
            port=s.SUPERBASE_POOL_PORT,
            database=s.SUPERBASE_POOL_DATABASE,
            user=s.SUPERBASE_POOL_USER,
            password=s.SUPERBASE_DB_PASSWORD,
            min_size=1,
            max_size=5,
            ssl="require",
        )
    return _main_pool


async def close_pools() -> None:
    global _logging_pool, _main_pool
    if _logging_pool:
        await _logging_pool.close()
    if _main_pool:
        await _main_pool.close()
