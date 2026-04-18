"""Handlers globaux d'exceptions : DomainException -> reponse HTTP structuree."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.shared.exceptions.domain_exception import DomainException


async def _handle_domain_exception(_request: Request, exc: DomainException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.http_status,
        content={"error": exc.code, "message": exc.message},
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Branche tous les handlers globaux sur l'app FastAPI."""
    app.add_exception_handler(DomainException, _handle_domain_exception)  # type: ignore[arg-type]
