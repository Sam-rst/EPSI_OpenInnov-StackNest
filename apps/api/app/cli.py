"""CLI d'administration StackNest.

Commande `create-admin` : cree le premier administrateur (compte pre-verifie,
role admin), sans passer par l'auto-inscription (qui ne cree que des `user`).
A executer une fois apres deploiement, par exemple :

    uv run python -m app.cli create-admin --email admin@stacknest.local

Le mot de passe est demande de maniere masquee (getpass) si non fourni en
option, pour eviter de le laisser dans l'historique du shell.
"""

import argparse
import asyncio
import getpass
from uuid import uuid4

from app.auth.domain.entities.user import User
from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.exceptions.email_already_used import EmailAlreadyUsedException
from app.auth.domain.interfaces.password_hasher import PasswordHasher
from app.auth.domain.interfaces.user_repository import UserRepository
from app.auth.domain.value_objects.email import Email
from app.auth.domain.value_objects.password import Password
from app.auth.infrastructure.repositories.sqlalchemy_user_repository import (
    SqlAlchemyUserRepository,
)
from app.auth.infrastructure.security.bcrypt_password_hasher import BcryptPasswordHasher
from app.catalog.infrastructure.repositories.sqlalchemy_template_repository import (
    SqlAlchemyTemplateRepository,
)
from app.catalog.infrastructure.seed.catalog_seeder import CatalogSeeder
from app.core.database.engine import get_sessionmaker


async def create_admin_account(
    *,
    email: str,
    password: str,
    repository: UserRepository,
    hasher: PasswordHasher,
) -> User:
    """Cree un utilisateur admin pre-verifie et le persiste via le depot.

    Leve `EmailAlreadyUsedException` si l'email est deja pris et `ValueError`
    si l'email ou le mot de passe ne respecte pas la politique (value objects).
    """
    normalized_email = Email(email)
    plain_password = Password(password)

    if await repository.get_by_email(normalized_email) is not None:
        raise EmailAlreadyUsedException()

    admin = User(
        id=uuid4(),
        email=normalized_email,
        password_hash=hasher.hash(plain_password),
        role=UserRole.ADMIN,
        is_verified=True,
        token_version=0,
    )
    return await repository.add(admin)


async def _run_create_admin(email: str, password: str) -> None:
    session_factory = get_sessionmaker()
    async with session_factory() as session:
        repository = SqlAlchemyUserRepository(session)
        created = await create_admin_account(
            email=email,
            password=password,
            repository=repository,
            hasher=BcryptPasswordHasher(),
        )
        await session.commit()
    print(f"Administrateur cree : {created.email} (id={created.id})")


async def _run_seed_catalog() -> None:
    session_factory = get_sessionmaker()
    async with session_factory() as session:
        seeder = CatalogSeeder(SqlAlchemyTemplateRepository(session))
        outcome = await seeder.seed()
        await session.commit()
    print(
        f"Seed catalogue : {outcome.inserted} insere(s), "
        f"{outcome.updated} mis a jour (convergent, idempotent)."
    )


def _prompt_password() -> str:
    password = getpass.getpass("Mot de passe administrateur : ")
    confirmation = getpass.getpass("Confirmez le mot de passe : ")
    if password != confirmation:
        raise SystemExit("Les mots de passe ne correspondent pas.")
    return password


def main(argv: list[str] | None = None) -> None:
    """Point d'entree de la CLI (parse les arguments et dispatche la commande)."""
    parser = argparse.ArgumentParser(
        prog="stacknest", description="CLI d'administration StackNest."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    create_admin = subparsers.add_parser("create-admin", help="Cree un administrateur pre-verifie.")
    create_admin.add_argument("--email", required=True, help="Adresse email de l'administrateur.")
    create_admin.add_argument(
        "--password",
        default=None,
        help="Mot de passe (sinon demande de maniere masquee).",
    )

    subparsers.add_parser(
        "seed-catalog",
        help="Seede le catalogue de templates (idempotent, rejouable).",
    )

    args = parser.parse_args(argv)
    if args.command == "create-admin":
        password = args.password or _prompt_password()
        asyncio.run(_run_create_admin(args.email, password))
    elif args.command == "seed-catalog":
        asyncio.run(_run_seed_catalog())


if __name__ == "__main__":
    main()
