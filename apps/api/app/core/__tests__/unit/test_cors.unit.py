"""Tests unitaires du cablage CORS sur la factory create_app.

Verifie que le middleware CORS est branche avec les origines issues des
settings et `allow_credentials=True` (le front envoie le cookie refresh).
"""

from starlette.middleware.cors import CORSMiddleware

from app.core.config import Settings
from app.main import create_app


def _find_cors_middleware(app: object) -> object | None:
    for middleware in app.user_middleware:  # type: ignore[attr-defined]
        if middleware.cls is CORSMiddleware:
            return middleware
    return None


class TestCorsMiddlewareWiring:
    def test_branche_le_middleware_cors_avec_les_origines_des_settings(self) -> None:
        settings = Settings(cors_origins=["https://app.stacknest.local"])

        app = create_app(settings)

        cors = _find_cors_middleware(app)
        assert cors is not None
        assert cors.kwargs["allow_origins"] == ["https://app.stacknest.local"]

    def test_autorise_les_credentials(self) -> None:
        settings = Settings(cors_origins=["https://app.stacknest.local"])

        app = create_app(settings)

        cors = _find_cors_middleware(app)
        assert cors is not None
        assert cors.kwargs["allow_credentials"] is True
