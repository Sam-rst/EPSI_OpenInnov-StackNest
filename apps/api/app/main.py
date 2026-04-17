"""Entrypoint FastAPI de StackNest API."""

from fastapi import FastAPI

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.core.middleware.logging_middleware import LoggingMiddleware

configure_logging()

app = FastAPI(title="StackNest API")
app.add_middleware(LoggingMiddleware)


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
