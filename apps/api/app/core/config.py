"""Configuration applicative chargee depuis les env vars (12-factor).

Source de verite des valeurs build/deploy : `version.json` a la racine du repo,
injecte par la CI au build (Docker ARG -> ENV). En local/dev, les defaults
permettent de demarrer sans configuration.
"""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Reglages applicatifs lus depuis l'environnement."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_version: str = "0.0.0-dev"
    git_commit: str = "unknown"
    app_env: str = "dev"
    deployed_at: str = "1970-01-01T00:00:00Z"
    sentry_dsn: str = ""

    # URL SQLAlchemy async (driver asyncpg). Le default pointe sur un Postgres
    # local (hors Docker) pour permettre un `uv run` sans .env ; en conteneur,
    # docker-compose injecte l'hote `db`. Source de verite : .env / env vars.
    database_url: str = "postgresql+asyncpg://stacknest:stacknest@localhost:5432/stacknest"

    # URL du client Redis (queue de jobs + pub/sub SSE + rate-limit auth). Le
    # default pointe sur un Redis local hors Docker ; en conteneur docker-compose
    # injecte l'hote `redis`. Source de verite : .env / env vars.
    redis_url: str = "redis://localhost:6379/0"

    # ---------- JWT ----------
    # Secret de signature HS256. Le default est volontairement un secret de DEV
    # explicite (jamais utilise en preview/prod : la CD injecte JWT_SECRET via
    # SOPS). Aucun secret reel n'est code en dur dans le repo.
    jwt_secret: str = "dev-insecure-change-me"
    jwt_access_ttl_seconds: int = 900  # 15 minutes
    jwt_refresh_ttl_seconds: int = 604800  # 7 jours

    # ---------- Politique d'authentification ----------
    # Verification d'email desactivee par defaut : un compte fraichement cree
    # peut se connecter sans cliquer le lien de verification (MVP). Mettre a
    # True en preview/prod pour exiger un email verifie a la connexion.
    auth_require_email_verification: bool = False

    # Rate-limit des endpoints d'auth sensibles (login, register, reset) :
    # au plus `max` tentatives par fenetre glissante de `window_seconds`.
    auth_rate_limit_max: int = 5
    auth_rate_limit_window_seconds: int = 60

    # ---------- Cookie du refresh token ----------
    # Le refresh token vit dans un cookie HttpOnly+Secure+SameSite=Strict afin
    # de mitiger XSS (HttpOnly) et CSRF (SameSite=Strict). `secure` reste True
    # par defaut ; il doit etre desactive explicitement en dev HTTP local.
    refresh_cookie_name: str = "stacknest_refresh"
    refresh_cookie_samesite: Literal["strict", "lax", "none"] = "strict"
    refresh_cookie_secure: bool = True
    # Chemin du cookie : `/` par defaut car l'API est servie derriere un prefixe
    # de passerelle `/api` (Vite en dev, Nginx en prod). Un chemin restreint cote
    # back (ex. `/auth/refresh`) ne matcherait pas l'URL publique
    # `/api/auth/refresh` -> cookie jamais renvoye. Resserrable via env en prod.
    refresh_cookie_path: str = "/"

    # ---------- Provisioning Docker ----------
    # Cible du demon Docker pour le `DockerSdkProvisioner` (worker de
    # deploiement). Vide par defaut = demon local (docker-py `from_env`), pratique
    # en dev. En preview/prod, la CD injecte `DOCKER_HOST=ssh://deployer@B` pour
    # provisionner sur l'hote d'execution distant (machine B), isole du plan de
    # controle (cf. spec deploiement, decisions 3 et 4). Aucun secret ici : la cle
    # SSH est geree hors application (agent SSH / fichier monte).
    docker_host: str = ""

    # ---------- Chat IA / LLM ----------
    # Fournisseur de LLM selectionne (pluggable, cf. design decision 5) :
    # `ollama` (defaut, local, sans cle), `openai` ou `anthropic`. La fabrique
    # est tolerante : aucune cle n'est requise au boot, seulement a l'appel
    # reseau effectif. Source de verite : .env / env vars.
    llm_provider: str = "ollama"
    # Cle d'API du fournisseur (OpenAI / Anthropic). Vide par defaut : Ollama ne
    # requiert pas de cle. La CD injecte la cle reelle via SOPS en preview/prod ;
    # aucun secret reel n'est code en dur dans le repo.
    llm_api_key: str = ""
    # Modele utilise (depend du fournisseur ; default neutre surchargeable).
    llm_model: str = "llama3.1"
    # URL de base de l'API du fournisseur. Vide = URL par defaut de l'adaptateur
    # (api.openai.com / api.anthropic.com / http://localhost:11434 pour Ollama).
    llm_base_url: str = ""
    # Timeout (secondes) des appels reseau au fournisseur LLM.
    llm_timeout_seconds: float = 60.0

    # ---------- CORS ----------
    # Origines autorisees a appeler l'API avec credentials (cookies). Liste
    # vide par defaut : en dev, le front est servi par le meme reverse-proxy
    # Nginx (origine identique, pas de CORS). Format env : JSON
    # `CORS_ORIGINS=["https://app.stacknest.local"]`.
    cors_origins: list[str] = []


@lru_cache
def get_settings() -> Settings:
    """Renvoie une instance Settings memoizee (1 lecture des env vars par process)."""
    return Settings()
