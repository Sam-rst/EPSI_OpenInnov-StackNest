"""Environnement Alembic asynchrone cable sur Base.metadata.

- `target_metadata = Base.metadata` : Alembic compare le schema de la base a
  l'ensemble des modeles ORM heritant de la Base partagee (autogenerate).
- L'URL est resolue depuis la config Alembic (`sqlalchemy.url`, fixee par les
  tests) sinon depuis `Settings.database_url` (env var `DATABASE_URL`).
- `compare_type=True` / `render_as_batch=True` : diffs de types fideles et
  migrations portables.
"""

import asyncio
from logging.config import fileConfig

from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlalchemy.pool import NullPool

from alembic import context
from app.core.config import get_settings
from app.core.database.base import Base

# Import a effet de bord : enregistre tous les modeles ORM sur Base.metadata
# pour que `--autogenerate` les detecte. Source unique : models_registry.
import app.core.database.models_registry  # noqa: F401  # isort: skip

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _resolve_database_url() -> str:
    """URL depuis la config Alembic si fournie (tests), sinon Settings."""
    configured = config.get_main_option("sqlalchemy.url")
    if configured:
        return configured
    return get_settings().database_url


def run_migrations_offline() -> None:
    """Migrations en mode 'offline' : genere du SQL sans connexion active."""
    context.configure(
        url=_resolve_database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def _run_migrations(connection: object) -> None:
    context.configure(
        connection=connection,  # type: ignore[arg-type]
        target_metadata=target_metadata,
        compare_type=True,
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def _run_async_migrations() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = _resolve_database_url()
    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    """Migrations en mode 'online' : connexion async reelle.

    Alembic est synchrone ; on pilote la coroutine via `asyncio.run`. Si un
    event loop tourne deja (cas des tests pytest-asyncio qui appellent
    `command.upgrade` depuis un test async), on execute la coroutine dans un
    thread dedie avec son propre loop pour eviter l'erreur de boucles
    imbriquees.
    """
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        asyncio.run(_run_async_migrations())
        return

    _run_in_dedicated_loop()


def _run_in_dedicated_loop() -> None:
    """Execute les migrations dans un thread avec un event loop isole."""
    from threading import Thread

    error: list[BaseException] = []

    def _worker() -> None:
        try:
            asyncio.run(_run_async_migrations())
        except BaseException as err:
            error.append(err)

    thread = Thread(target=_worker)
    thread.start()
    thread.join()
    if error:
        raise error[0]


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
