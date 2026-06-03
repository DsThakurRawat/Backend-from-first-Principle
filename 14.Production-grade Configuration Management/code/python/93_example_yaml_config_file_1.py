from enum import Enum
from functools import lru_cache

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Environment(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class Settings(BaseSettings):
    """
    All runtime config. pydantic VALIDATES every field automatically
    when the object is constructed — mandatory fields without a default
    raise an error immediately at startup, not silently in production.
    """
    model_config = SettingsConfigDict(
        env_file=".env",        # load .env in local dev
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application settings (with sensible defaults)
    port: int = Field(default=8080, ge=1, le=65535)
    log_level: str = Field(default="info", pattern="^(debug|info|warn|error)$")
    app_env: Environment = Environment.DEVELOPMENT

    # Database config — mandatory, no defaults (will fail if missing)
    db_host: str
    db_port: int = 5432
    db_user: str
    db_password: str          # sensitive — never hardcoded
    db_name: str
    db_pool_size: int = Field(default=10, ge=1)  # dev=10, prod=50, staging=2

    # External services — mandatory secret
    stripe_api_key: str

    # Feature flag — optional, defaults off
    new_checkout_enabled: bool = False

    @computed_field
    @property
    def database_url(self) -> str:
        return (
            f"postgresql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )


@lru_cache  # load & validate once, reuse everywhere (singleton)
def get_settings() -> Settings:
    # Construction triggers validation. If a mandatory var is
    # missing, pydantic raises here — at startup, loudly.
    return Settings()


# Usage:
#   settings = get_settings()   # crashes early if config invalid
#   print(settings.database_url)
#   if settings.new_checkout_enabled: ...
