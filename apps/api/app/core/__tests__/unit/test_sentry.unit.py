"""Tests unitaires de l'init Sentry.

CA6 : si SENTRY_DSN absent -> no-op silencieux ; si present -> sentry_sdk.init
appele avec le DSN. Test pur logique (mock de sentry_sdk.init).
"""

from unittest.mock import patch


class TestInitSentry:
    def test_no_op_when_dsn_is_empty(self) -> None:
        """Etant donne un DSN vide, quand on appelle init_sentry, alors
        sentry_sdk.init n'est PAS appele."""
        from app.core.sentry import init_sentry

        with patch("app.core.sentry.sentry_sdk.init") as mock_init:
            init_sentry(dsn="", environment="dev")

        mock_init.assert_not_called()

    def test_initializes_sdk_when_dsn_provided(self) -> None:
        """Etant donne un DSN non vide, quand on appelle init_sentry, alors
        sentry_sdk.init est appele avec ce DSN et l'environnement."""
        from app.core.sentry import init_sentry

        with patch("app.core.sentry.sentry_sdk.init") as mock_init:
            init_sentry(dsn="https://key@sentry.io/1", environment="prod")

        mock_init.assert_called_once()
        kwargs = mock_init.call_args.kwargs
        assert kwargs["dsn"] == "https://key@sentry.io/1"
        assert kwargs["environment"] == "prod"
