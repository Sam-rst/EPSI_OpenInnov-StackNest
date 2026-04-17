"""Initialisation Sentry : silencieux si DSN absent, configure sinon."""

import sentry_sdk


def init_sentry(dsn: str, environment: str) -> None:
    """Initialise Sentry SDK si un DSN est fourni, sinon no-op silencieux.

    Permet aux environnements de dev locaux de tourner sans configurer Sentry.
    """
    if not dsn:
        return

    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        send_default_pii=False,
    )
