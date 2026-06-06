"""Tests unitaires de l'entite de domaine User."""

from uuid import uuid4

import pytest

from app.auth.domain.entities.user import User
from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.value_objects.email import Email


def _build_user(**overrides: object) -> User:
    defaults: dict[str, object] = {
        "id": uuid4(),
        "email": Email("user@stacknest.local"),
        "password_hash": "$2b$12$hash",
        "role": UserRole.USER,
        "is_verified": False,
        "token_version": 0,
    }
    defaults.update(overrides)
    return User(**defaults)  # type: ignore[arg-type]


class TestUserConstruction:
    def test_construit_un_utilisateur_valide(self) -> None:
        user = _build_user()

        assert user.email == Email("user@stacknest.local")
        assert user.role is UserRole.USER
        assert user.is_verified is False
        assert user.token_version == 0


class TestUserGuards:
    def test_rejette_un_hash_vide(self) -> None:
        with pytest.raises(ValueError):
            _build_user(password_hash="")

    def test_rejette_une_token_version_negative(self) -> None:
        with pytest.raises(ValueError):
            _build_user(token_version=-1)


class TestUserBehaviour:
    def test_is_admin_vrai_pour_un_admin(self) -> None:
        assert _build_user(role=UserRole.ADMIN).is_admin() is True

    def test_is_admin_faux_pour_un_user(self) -> None:
        assert _build_user(role=UserRole.USER).is_admin() is False
