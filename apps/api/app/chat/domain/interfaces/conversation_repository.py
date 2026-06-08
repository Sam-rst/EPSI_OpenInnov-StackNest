"""Interface (port) du depot de conversations et de leurs messages."""

from abc import ABC, abstractmethod
from uuid import UUID

from app.chat.domain.entities.conversation import Conversation
from app.chat.domain.entities.message import Message


class ConversationRepository(ABC):
    """Contrat de persistance des fils de discussion et de leurs messages.

    Implemente en infrastructure par un adaptateur SQLAlchemy. Les use cases en
    dependent par inversion : ils ignorent tout des modeles ORM. Les acces sont
    isoles par proprietaire via `list_by_owner` (cf. design securite). Le
    repository ne commit pas : la transaction est geree par l'appelant.
    """

    @abstractmethod
    async def add(self, conversation: Conversation) -> Conversation:
        """Persiste un nouveau fil de discussion puis le renvoie."""

    @abstractmethod
    async def get_by_id(self, conversation_id: UUID) -> Conversation | None:
        """Renvoie le fil par son id, ou None s'il n'existe pas."""

    @abstractmethod
    async def list_by_owner(self, owner_id: UUID) -> list[Conversation]:
        """Renvoie tous les fils appartenant a cet utilisateur."""

    @abstractmethod
    async def update(self, conversation: Conversation) -> Conversation:
        """Met a jour un fil existant (titre) puis le renvoie."""

    @abstractmethod
    async def delete(self, conversation_id: UUID) -> None:
        """Supprime un fil et ses messages (cascade)."""

    @abstractmethod
    async def add_message(self, message: Message) -> Message:
        """Persiste un message rattache a un fil puis le renvoie."""

    @abstractmethod
    async def list_messages(self, conversation_id: UUID) -> list[Message]:
        """Renvoie les messages d'un fil, par ordre chronologique de creation."""
