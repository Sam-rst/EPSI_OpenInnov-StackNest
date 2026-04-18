"""Entrypoint FastAPI de StackNest API."""

from typing import Annotated

from fastapi import Depends, FastAPI

from app.core.config import Settings, get_settings
from app.core.exception_handlers import register_exception_handlers
from app.core.logging import configure_logging
from app.core.middleware.logging_middleware import LoggingMiddleware
from app.core.presentation.schemas.responses.health_response import HealthResponse
from app.core.presentation.schemas.responses.version_response import VersionResponse
from app.core.sentry import init_sentry

# Environnements internes autorises a exposer Swagger / ReDoc / OpenAPI.
# En dehors (preview, prod, staging, ...) on desactive pour ne pas divulguer
# la surface d'attaque (info disclosure). Defense en profondeur : meme si un
# proxy externe oubliait de bloquer /docs, l'API refuserait.
_DOCS_ENABLED_ENVS: frozenset[str] = frozenset({"dev", "test"})

SettingsDep = Annotated[Settings, Depends(get_settings)]


def create_app(settings: Settings | None = None) -> FastAPI:
    """Construit l'application FastAPI a partir des settings fournis.

    Factory pour permettre les tests unitaires avec differentes configs
    (notamment verifier la desactivation de Swagger selon APP_ENV).
    """
    effective_settings = settings or get_settings()
    docs_enabled = effective_settings.app_env in _DOCS_ENABLED_ENVS

    app = FastAPI(
        title="StackNest API",
        description=(
            "Backend de l'**Internal Developer Platform StackNest**. "
            "Permet aux equipes techniques de provisionner des ressources IT "
            "(VM, bases de donnees, environnements) de maniere autonome via "
            "une UI web ou un chatbot IA, orchestre par Terraform et Docker."
        ),
        version="0.1.0-dev",
        docs_url="/docs" if docs_enabled else None,
        redoc_url="/redoc" if docs_enabled else None,
        openapi_url="/openapi.json" if docs_enabled else None,
        openapi_tags=[
            {
                "name": "Platform",
                "description": (
                    "Endpoints transverses exposes par la plateforme : liveness "
                    "probe, metadonnees de build. Consommes par Kubernetes, "
                    "Docker healthchecks, monitoring."
                ),
            },
        ],
    )
    app.add_middleware(LoggingMiddleware)
    register_exception_handlers(app)

    @app.get("/health", tags=["Platform"], summary="Liveness probe")
    async def health() -> HealthResponse:
        """Retourne `200 OK` avec `{ status: 'ok' }` si l'API est demarree.

        Utilise par Kubernetes / Docker pour determiner si le container doit etre
        redemarre. Pas de dependance externe verifiee (pas de DB, pas de Redis) —
        c'est une **liveness**, pas une readiness.
        """
        return HealthResponse(status="ok")

    @app.get("/version", tags=["Platform"], summary="Metadonnees de build et de deploiement")
    async def version(settings: SettingsDep) -> VersionResponse:
        """Renvoie la version applicative, le SHA du commit deploye,
        l'environnement d'execution et le timestamp de deploiement.

        Ces valeurs sont injectees au build par la CI (ARG Docker) puis lues
        depuis l'environnement via `pydantic-settings`. Sans injection, les
        defaults renvoient des valeurs de dev (`0.0.0-dev` / `unknown` / `dev`).
        """
        return VersionResponse(
            version=settings.app_version,
            commit=settings.git_commit,
            env=settings.app_env,
            deployed_at=settings.deployed_at,
        )

    return app


configure_logging()
_settings = get_settings()
init_sentry(dsn=_settings.sentry_dsn, environment=_settings.app_env)

app = create_app(_settings)
