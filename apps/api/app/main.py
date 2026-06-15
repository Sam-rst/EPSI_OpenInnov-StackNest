"""Entrypoint FastAPI de StackNest API."""

from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.presentation.routers.auth_router import router as auth_router
from app.catalog.presentation.routers.catalog_router import router as catalog_router
from app.chat.presentation.routers.chat_router import router as chat_router
from app.core.config import Settings, get_settings
from app.core.exception_handlers import register_exception_handlers
from app.core.logging import configure_logging
from app.core.middleware.logging_middleware import LoggingMiddleware
from app.core.presentation.schemas.responses.version_response import VersionResponse
from app.core.sentry import init_sentry
from app.deployment.presentation.routers.deployment_router import (
    router as deployment_router,
)
from app.health.presentation.routers.health_router import router as health_router
from app.stack.presentation.routers.stack_router import router as stack_router

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
        version="0.78.0",
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
            {
                "name": "Auth",
                "description": (
                    "Authentification et gestion de session : inscription, "
                    "verification d'email, connexion, rafraichissement, "
                    "deconnexion, profil et reinitialisation de mot de passe."
                ),
            },
            {
                "name": "Catalogue",
                "description": (
                    "Catalogue des templates provisionnables : consultation "
                    "(liste + detail) pour les utilisateurs, gestion CRUD "
                    "reservee aux administrateurs."
                ),
            },
            {
                "name": "Deploiement",
                "description": (
                    "Provisioning et cycle de vie des deploiements de "
                    "l'utilisateur : creation (lance le provisioning), liste, "
                    "detail, actions (stop/start/destroy/regenerate-password) et "
                    "flux SSE des events de progression (le secret n'y transite "
                    "qu'une seule fois, sur l'event running)."
                ),
            },
            {
                "name": "Chat IA",
                "description": (
                    "Assistant conversationnel : fils de discussion (CRUD), envoi "
                    "de messages (traitement asynchrone, suivi via flux SSE), et "
                    "confirmation / rejet des actions proposees (deleguees aux use "
                    "cases de deploiement). Le LLM ne voit jamais de secret."
                ),
            },
            {
                "name": "Stack",
                "description": (
                    "Composeur de stacks multi-services : creation (composition "
                    "validee puis persistee, le provisioning compose viendra plus "
                    "tard), liste, detail (services + liens) et suppression. Toutes "
                    "les routes sont isolees par proprietaire ; aucun secret ne "
                    "figure dans les reponses (params secret masques)."
                ),
            },
        ],
    )
    app.add_middleware(LoggingMiddleware)
    # CORS : autorise le front (origines des settings) a appeler l'API avec
    # credentials (le refresh token voyage dans un cookie). En dev, le front est
    # servi par le meme reverse-proxy Nginx (origine identique) -> liste vide.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=effective_settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(app)
    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(catalog_router)
    app.include_router(deployment_router)
    app.include_router(chat_router)
    app.include_router(stack_router)

    @app.get("/version", tags=["Platform"], summary="Metadonnees de build et de deploiement")
    async def version(settings: SettingsDep) -> VersionResponse:
        """Renvoie la version applicative, le SHA du commit deploye,
        l'environnement d'execution et le timestamp de deploiement.

        Ces valeurs sont injectees au build par la CI (ARG Docker) puis lues
        depuis l'environnement via `pydantic-settings`. Sans injection, les
        defaults reprennent `version.json` (`0.78.0` / `unknown` / `dev`).
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
