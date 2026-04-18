"""Test d'integration du handler global DomainException -> HTTP.

CA7 : une DomainException levee dans une route est transformee en
reponse HTTP avec status configure et body { error, message }.

Niveau integration car le test traverse le pipeline ASGI complet
(route -> exception -> handler) via `httpx.ASGITransport`.
"""

from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.core.exception_handlers import register_exception_handlers
from app.shared.exceptions.domain_exception import DomainException


class TestDomainExceptionHandler:
    async def test_translates_domain_exception_to_http_response(self) -> None:
        """Etant donne une route qui leve DomainException(code, message, http_status),
        quand on l'appelle, alors la reponse a le bon status + body { error, message }."""
        app = FastAPI()
        register_exception_handlers(app)

        @app.get("/boom")
        async def boom() -> None:
            raise DomainException(
                code="TEMPLATE_NOT_FOUND",
                message="Template introuvable",
                http_status=404,
            )

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/boom")

        assert response.status_code == 404
        assert response.json() == {
            "error": "TEMPLATE_NOT_FOUND",
            "message": "Template introuvable",
        }
