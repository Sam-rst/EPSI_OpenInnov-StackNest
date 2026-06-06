"""Mapper de conversion entre l'entite de domaine User et le modele ORM UserModel."""

from app.auth.domain.entities.user import User
from app.auth.domain.value_objects.email import Email
from app.auth.infrastructure.models.user_model import UserModel


class UserMapper:
    """Traduit entre le domaine (User + VOs) et la persistance (UserModel).

    Isole le domaine de SQLAlchemy : le repository ne manipule que des entites,
    le mapper se charge de la conversion bidirectionnelle. L'email est stocke
    via sa valeur normalisee (le VO Email garantit minuscules + format).
    """

    @staticmethod
    def to_entity(model: UserModel) -> User:
        return User(
            id=model.id,
            email=Email(model.email),
            password_hash=model.password_hash,
            role=model.role,
            is_verified=model.is_verified,
            token_version=model.token_version,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def to_model(entity: User) -> UserModel:
        return UserModel(
            id=entity.id,
            email=entity.email.value,
            password_hash=entity.password_hash,
            role=entity.role,
            is_verified=entity.is_verified,
            token_version=entity.token_version,
        )
