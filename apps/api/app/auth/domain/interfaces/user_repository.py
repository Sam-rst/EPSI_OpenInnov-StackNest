"""Interface (port) du depot d'utilisateurs."""

from abc import ABC, abstractmethod
from uuid import UUID

from app.auth.domain.entities.user import User
from app.auth.domain.value_objects.email import Email


class UserRepository(ABC):
    """Contrat de persistance des utilisateurs.

    Implemente en infrastructure par un adaptateur SQLAlchemy. Les use cases
    dependent de cette abstraction (inversion de dependance) : ils ignorent
    tout de la base et des modeles ORM.
    """

    @abstractmethod
    async def get_by_email(self, email: Email) -> User | None:
        """Renvoie l'utilisateur portant cet email, ou None s'il n'existe pas."""

    @abstractmethod
    async def get_by_id(self, user_id: UUID) -> User | None:
        """Renvoie l'utilisateur portant cet identifiant, ou None."""

    @abstractmethod
    async def add(self, user: User) -> User:
        """Persiste un nouvel utilisateur et renvoie l'entite persistee."""

    @abstractmethod
    async def update(self, user: User) -> User:
        """Met a jour un utilisateur existant et renvoie l'entite a jour."""
