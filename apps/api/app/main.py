"""Entrypoint FastAPI de StackNest API."""

from fastapi import FastAPI

from app.core.config import get_settings

app = FastAPI(title="StackNest API")


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
