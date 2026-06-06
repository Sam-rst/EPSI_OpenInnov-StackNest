"""Tests unitaires du mapper User <-> UserModel."""

from datetime import UTC, datetime
from uuid import uuid4

from app.auth.domain.entities.user import User
from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.value_objects.email import Email
from app.auth.infrastructure.mappers.user_mapper import UserMapper
from app.auth.infrastructure.models.user_model import UserModel


class TestUserMapperToEntity:
    def test_convertit_le_modele_en_entite(self) -> None:
        identifier = uuid4()
        now = datetime.now(UTC)
        model = UserModel(
            id=identifier,
            email="user@stacknest.local",
            password_hash="$2b$12$hash",
            role=UserRole.ADMIN,
            is_verified=True,
            token_version=4,
            created_at=now,
            updated_at=now,
        )

        entity = UserMapper.to_entity(model)

        assert entity.id == identifier
        assert entity.email == Email("user@stacknest.local")
        assert entity.role is UserRole.ADMIN
        assert entity.is_verified is True
        assert entity.token_version == 4


class TestUserMapperToModel:
    def test_convertit_l_entite_en_modele(self) -> None:
        identifier = uuid4()
        entity = User(
            id=identifier,
            email=Email("User@StackNest.Local"),
            password_hash="$2b$12$hash",
            role=UserRole.USER,
            is_verified=False,
            token_version=0,
        )

        model = UserMapper.to_model(entity)

        assert model.id == identifier
        # L'email est stocke normalise (minuscules).
        assert model.email == "user@stacknest.local"
        assert model.role is UserRole.USER
