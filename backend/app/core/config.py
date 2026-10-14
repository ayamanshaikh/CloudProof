from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

# Ensure default database path resolves to project root cloudproof.db regardless of CWD
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
DEFAULT_DB_URL = f"sqlite+aiosqlite:///{ (PROJECT_ROOT / 'cloudproof.db').as_posix() }"


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # API
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"

    # Database
    DATABASE_URL: str = DEFAULT_DB_URL

    # Security
    JWT_SECRET: str = "dev_secret_key_cloudproof_2026_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    AUTH_RATE_LIMIT: int = 10
    VERIFY_RATE_LIMIT: int = 20
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # AI
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.8-flash"

    # AWS
    AWS_REGION: str = "us-east-1"
    AWS_ASSUME_ROLE_ENABLED: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
