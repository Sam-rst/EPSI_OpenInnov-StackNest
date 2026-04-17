"""Entrypoint FastAPI de StackNest API."""

from fastapi import FastAPI

app = FastAPI(title="StackNest API")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
