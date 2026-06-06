"""Reglages SMTP locaux au track auth (en attendant la config centralisee STN-35).

Le socle `core.config.Settings` ne porte pas encore la configuration SMTP : ces
reglages sont donc lus ici, dans le perimetre du track auth, via les variables
d'environnement `SMTP_*`. Les defauts ciblent MailHog en dev (port 1025, sans
auth ni STARTTLS) afin que `register`/`forgot` fonctionnent sans configuration.
Quand STN-35 centralisera la config, ces champs migreront dans `Settings`.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class SmtpSettings(BaseSettings):
    """Configuration SMTP + URLs front pour les emails transactionnels auth."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_use_starttls: bool = False
    smtp_from_address: str = "no-reply@stacknest.local"

    # Base des liens cliquables dans les emails (page front qui poste le token).
    # En dev, le front Vite tourne en local ; en prod, l'URL publique de l'app.
    auth_verify_url_base: str = "http://localhost:5173/verify"
    auth_reset_url_base: str = "http://localhost:5173/reset"

    # Durees de vie des tokens email (secondes).
    auth_verify_token_ttl_seconds: int = 86400  # 24 h
    auth_reset_token_ttl_seconds: int = 3600  # 1 h


@lru_cache
def get_smtp_settings() -> SmtpSettings:
    """Renvoie une instance SmtpSettings memoizee (1 lecture des env vars/process)."""
    return SmtpSettings()
