from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    SERVICE_NAME: str = "super-admin-service"
    PORT: int = 5000

    # Logging DB
    LOGGING_SUPERBASE_POOL_HOST: str
    LOGGING_SUPERBASE_POOL_PORT: int = 5432
    LOGGING_SUPERBASE_POOL_DATABASE: str = "postgres"
    LOGGING_SUPERBASE_POOL_USER: str
    LOGGING_SUPERBASE_DB_PASSWORD: str

    # Main app DB
    SUPERBASE_POOL_HOST: str
    SUPERBASE_POOL_PORT: int = 5432
    SUPERBASE_POOL_DATABASE: str = "postgres"
    SUPERBASE_POOL_USER: str
    SUPERBASE_DB_PASSWORD: str

    # Admin auth
    ADMIN_JWT_SECRET: str
    ADMIN_JWT_EXPIRES_MINUTES: int = 60
    ADMIN_USERNAME: str = "superadmin"
    ADMIN_PASSWORD: str

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
