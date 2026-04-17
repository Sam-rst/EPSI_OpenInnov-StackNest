"""Configuration structlog pour des logs JSON structures (12-factor / Sentry friendly)."""

import logging

import structlog


def configure_logging(level: str = "INFO") -> None:
    """Configure structlog en sortie JSON sur stdout.

    Idempotent : peut etre appele plusieurs fois sans dupliquer les handlers.
    """
    log_level = getattr(logging, level.upper())

    logging.basicConfig(format="%(message)s", level=log_level, force=True)

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
        cache_logger_on_first_use=True,
    )
