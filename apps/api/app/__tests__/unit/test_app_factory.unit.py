"""Tests unitaires pour la factory create_app.

Verifie que Swagger/ReDoc/OpenAPI sont exposes en dev/test et desactives
en preview/prod — defense en profondeur cote API (pas d'info disclosure
sur la surface d'attaque en environnement exterieur).
"""

import pytest

from app.core.config import Settings
from app.main import create_app


class TestCreateAppDocsExposure:
    @pytest.mark.parametrize("env", ["dev", "test"])
    def test_expose_swagger_redoc_openapi_en_env_interne(self, env: str) -> None:
        """En dev et test, les endpoints de doc sont actifs."""
        settings = Settings(app_env=env)

        app = create_app(settings)

        assert app.docs_url == "/docs"
        assert app.redoc_url == "/redoc"
        assert app.openapi_url == "/openapi.json"

    @pytest.mark.parametrize("env", ["preview", "prod"])
    def test_desactive_swagger_redoc_openapi_en_env_expose(self, env: str) -> None:
        """En preview et prod, les endpoints de doc sont desactives (None)."""
        settings = Settings(app_env=env)

        app = create_app(settings)

        assert app.docs_url is None
        assert app.redoc_url is None
        assert app.openapi_url is None

    def test_desactive_par_defaut_si_env_inconnu(self) -> None:
        """Un env non-liste (ex: 'staging') est traite comme expose → docs off."""
        settings = Settings(app_env="staging")

        app = create_app(settings)

        assert app.docs_url is None
