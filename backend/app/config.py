from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "QueryFlow"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # JWT
    JWT_SECRET: str = "change_me_in_production_256_bit_secret"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Database (QueryFlow App DB)
    DATABASE_URL: str = "postgresql+asyncpg://queryflow:queryflow@localhost:5432/queryflow"

    # Encryption (for user DB credentials)
    DB_ENCRYPTION_KEY: str = "0" * 64  # 32-byte hex key — override in production

    # LLM APIs
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    DEFAULT_LLM_PROVIDER: str = "gemini"  # gemini | openai

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 30

    # Email
    SMTP_HOST: str = "smtp.sendgrid.net"
    SMTP_PORT: int = 587
    SMTP_USER: str = "apikey"
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "noreply@queryflow.app"

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
