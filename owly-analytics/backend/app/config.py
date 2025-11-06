"""Application configuration."""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    # Application
    PROJECT_NAME: str = "Owly Analytics"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 3000

    # Database
    POSTGRES_USER: str = "owly"
    POSTGRES_PASSWORD: str = "owly"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "owly_db"

    @property
    def DATABASE_URL(self) -> str:
        """Construct database URL."""
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    @property
    def REDIS_URL(self) -> str:
        """Construct Redis URL."""
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"

    # CORS
    ALLOWED_ORIGINS: str = "chrome-extension://,http://localhost:3000"

    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Parse CORS origins."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
