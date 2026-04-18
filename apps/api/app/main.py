"""Entrypoint FastAPI de StackNest API."""

from typing import Annotated

from fastapi import Depends, FastAPI

from app.core.config import Settings, get_settings
from app.core.exception_handlers import register_exception_handlers
from app.core.logging import configure_logging
from app.core.middleware.logging_middleware import LoggingMiddleware
from app.core.presentation.schemas.responses.version_response import VersionResponse
from app.core.sentry import init_sentry
from app.health.presentation.routers.health_router import router as health_router

configure_logging()
_settings = get_settings()
init_sentry(dsn=_settings.sentry_dsn, environment=_settings.app_env)

app = FastAPI(
    title="StackNest API",
    description=(
        "Backend de l'**Internal Developer Platform StackNest**. "
        "Permet aux equipes techniques de provisionner des ressources IT "
        "(VM, bases de donnees, environnements) de maniere autonome via "
        "une UI web ou un chatbot IA, orchestre par Terraform et Docker."
    ),
    version="0.1.0-dev",
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
app.include_router(health_router)


SettingsDep = Annotated[Settings, Depends(get_settings)]


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
