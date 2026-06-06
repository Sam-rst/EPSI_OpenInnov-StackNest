"""Tests unitaires de la logique CLI create-admin (fakes en memoire)."""

import getpass
from uuid import UUID, uuid4

import pytest

import app.cli as cli
from app.auth.domain.entities.user import User
from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.exceptions.email_already_used import EmailAlreadyUsedException
from app.auth.domain.interfaces.password_hasher import PasswordHasher
from app.auth.domain.interfaces.user_repository import UserRepository
from app.auth.domain.value_objects.email import Email
from app.auth.domain.value_objects.password import Password
from app.cli import create_admin_account


class _FakeUserRepository(UserRepository):
    def __init__(self, users: list[User]) -> None:
        self._by_email = {user.email.value: user for user in users}
        self.added: list[User] = []

    async def get_by_email(self, email: Email) -> User | None:
        return self._by_email.get(email.value)

    async def get_by_id(self, user_id: UUID) -> User | None:
        raise NotImplementedError

    async def add(self, user: User) -> User:
        self._by_email[user.email.value] = user
        self.added.append(user)
        return user

    async def update(self, user: User) -> User:
        raise NotImplementedError


class _FakeHasher(PasswordHasher):
    def hash(self, password: Password) -> str:
        return f"hashed::{password.value}"

    def verify(self, password: Password, password_hash: str) -> bool:
        return password_hash == f"hashed::{password.value}"


class TestCreateAdminAccount:
    async def test_cree_un_admin_preverifie(self) -> None:
        repository = _FakeUserRepository([])

        created = await create_admin_account(
            email="admin@stacknest.local",
            password="adminpass1",
            repository=repository,
            hasher=_FakeHasher(),
        )

        assert created.role is UserRole.ADMIN
        assert created.is_verified is True
        assert created.password_hash == "hashed::adminpass1"
        assert repository.added[0].email == Email("admin@stacknest.local")

    async def test_email_deja_pris_leve_email_already_used(self) -> None:
        existant = User(
            id=uuid4(),
            email=Email("admin@stacknest.local"),
            password_hash="hashed::x",
            role=UserRole.ADMIN,
            is_verified=True,
        )
        repository = _FakeUserRepository([existant])

        with pytest.raises(EmailAlreadyUsedException):
            await create_admin_account(
                email="admin@stacknest.local",
                password="adminpass1",
                repository=repository,
                hasher=_FakeHasher(),
            )

    async def test_mot_de_passe_faible_leve_value_error(self) -> None:
        repository = _FakeUserRepository([])

        with pytest.raises(ValueError):
            await create_admin_account(
                email="admin@stacknest.local",
                password="faible",
                repository=repository,
                hasher=_FakeHasher(),
            )


class TestMainDispatch:
    def test_create_admin_avec_password_appelle_le_runner(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        calls: list[tuple[str, str]] = []

        async def _fake_run(email: str, password: str) -> None:
            calls.append((email, password))

        monkeypatch.setattr(cli, "_run_create_admin", _fake_run)

        cli.main(["create-admin", "--email", "admin@stacknest.local", "--password", "adminpass1"])

        assert calls == [("admin@stacknest.local", "adminpass1")]

    def test_create_admin_sans_password_demande_le_prompt(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        captured: list[str] = []

        async def _fake_run(email: str, password: str) -> None:
            captured.append(password)

        monkeypatch.setattr(cli, "_run_create_admin", _fake_run)
        monkeypatch.setattr(cli, "_prompt_password", lambda: "promptedpass1")

        cli.main(["create-admin", "--email", "admin@stacknest.local"])

        assert captured == ["promptedpass1"]

    def test_sans_commande_quitte_avec_erreur(self) -> None:
        with pytest.raises(SystemExit):
            cli.main([])


class TestPromptPassword:
    def test_mots_de_passe_concordants_renvoie_le_secret(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        responses = iter(["secret1234", "secret1234"])
        monkeypatch.setattr(getpass, "getpass", lambda _prompt: next(responses))

        assert cli._prompt_password() == "secret1234"

    def test_mots_de_passe_differents_quitte(self, monkeypatch: pytest.MonkeyPatch) -> None:
        responses = iter(["secret1234", "autre56789"])
        monkeypatch.setattr(getpass, "getpass", lambda _prompt: next(responses))

        with pytest.raises(SystemExit):
            cli._prompt_password()
