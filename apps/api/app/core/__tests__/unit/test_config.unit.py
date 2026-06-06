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


class TestRedisUrlSetting:
    def test_expose_un_redis_url_par_defaut(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("REDIS_URL", raising=False)

        settings = Settings()

        assert settings.redis_url.startswith("redis://")

    def test_lit_redis_url_depuis_l_environnement(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("REDIS_URL", "redis://cache:6379/3")

        settings = Settings()

        assert settings.redis_url == "redis://cache:6379/3"


class TestJwtSettings:
    def test_jwt_secret_par_defaut_est_un_secret_de_dev(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.delenv("JWT_SECRET", raising=False)

        settings = Settings()

        assert settings.jwt_secret

    def test_lit_jwt_secret_depuis_l_environnement(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("JWT_SECRET", "super-secret-de-prod")

        settings = Settings()

        assert settings.jwt_secret == "super-secret-de-prod"

    def test_ttl_access_par_defaut_vaut_quinze_minutes(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.delenv("JWT_ACCESS_TTL_SECONDS", raising=False)

        settings = Settings()

        assert settings.jwt_access_ttl_seconds == 900

    def test_ttl_refresh_par_defaut_vaut_sept_jours(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("JWT_REFRESH_TTL_SECONDS", raising=False)

        settings = Settings()

        assert settings.jwt_refresh_ttl_seconds == 604800


class TestAuthPolicySettings:
    def test_verification_email_desactivee_par_defaut(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.delenv("AUTH_REQUIRE_EMAIL_VERIFICATION", raising=False)

        settings = Settings()

        assert settings.auth_require_email_verification is False

    def test_rate_limit_par_defaut(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("AUTH_RATE_LIMIT_MAX", raising=False)
        monkeypatch.delenv("AUTH_RATE_LIMIT_WINDOW_SECONDS", raising=False)

        settings = Settings()

        assert settings.auth_rate_limit_max > 0
        assert settings.auth_rate_limit_window_seconds > 0


class TestRefreshCookieSettings:
    def test_nom_du_cookie_refresh_par_defaut(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("REFRESH_COOKIE_NAME", raising=False)

        settings = Settings()

        assert settings.refresh_cookie_name

    def test_cookie_samesite_strict_par_defaut(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("REFRESH_COOKIE_SAMESITE", raising=False)

        settings = Settings()

        assert settings.refresh_cookie_samesite == "strict"

    def test_cookie_secure_active_par_defaut(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("REFRESH_COOKIE_SECURE", raising=False)

        settings = Settings()

        assert settings.refresh_cookie_secure is True


class TestCorsSettings:
    def test_cors_origins_par_defaut_est_une_liste(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("CORS_ORIGINS", raising=False)

        settings = Settings()

        assert isinstance(settings.cors_origins, list)

    def test_cors_origins_parse_une_liste_json(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("CORS_ORIGINS", '["https://app.stacknest.local"]')

        settings = Settings()

        assert settings.cors_origins == ["https://app.stacknest.local"]
