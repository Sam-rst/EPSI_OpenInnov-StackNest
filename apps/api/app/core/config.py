"""Configuration applicative chargee depuis les env vars (12-factor).

Source de verite des valeurs build/deploy : `version.json` a la racine du repo,
injecte par la CI au build (Docker ARG -> ENV). En local/dev, les defaults
permettent de demarrer sans configuration.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Reglages applicatifs lus depuis l'environnement."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_version: str = "0.0.0-dev"
    git_commit: str = "unknown"
    app_env: str = "dev"
    deployed_at: str = "1970-01-01T00:00:00Z"


@lru_cache
def get_settings() -> Settings:
    """Renvoie une instance Settings memoizee (1 lecture des env vars par process)."""
    return Settings()
