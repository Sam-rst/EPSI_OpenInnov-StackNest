"""Tests unitaires de la configuration applicative (Settings)."""

import pytest

from app.core.config import Settings


class TestDatabaseUrlSetting:
    def test_expose_un_database_url_par_defaut(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("DATABASE_URL", raising=False)

        settings = Settings()

        assert settings.database_url.startswith("postgresql+asyncpg://")

    def test_lit_database_url_depuis_l_environnement(self, monkeypatch: pytest.MonkeyPatch) -> None:
        url = "postgresql+asyncpg://u:p@host:5432/db"
        monkeypatch.setenv("DATABASE_URL", url)

        settings = Settings()

        assert settings.database_url == url
