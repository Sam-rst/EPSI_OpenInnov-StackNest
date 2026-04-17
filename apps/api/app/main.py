"""Entrypoint FastAPI de StackNest API."""

from fastapi import FastAPI

from app.core.config import get_settings
from app.core.exception_handlers import register_exception_handlers
from app.core.logging import configure_logging
from app.core.middleware.logging_middleware import LoggingMiddleware
from app.core.sentry import init_sentry

configure_logging()
_settings = get_settings()
init_sentry(dsn=_settings.sentry_dsn, environment=_settings.app_env)

app = FastAPI(title="StackNest API")
app.add_middleware(LoggingMiddleware)
register_exception_handlers(app)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/version")
async def version() -> dict[str, str]:
    settings = get_settings()
    return {
        "version": settings.app_version,
        "commit": settings.git_commit,
        "env": settings.app_env,
        "deployed_at": settings.deployed_at,
    }
