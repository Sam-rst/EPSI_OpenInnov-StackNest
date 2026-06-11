"""Interface (port) du depot des actions de chat (trace auditable)."""

from abc import ABC, abstractmethod
from uuid import UUID

from app.chat.domain.entities.chat_action import ChatAction


class ChatActionRepository(ABC):
    """Contrat de persistance des actions proposees par le chat.

    Implemente en infrastructure par un adaptateur SQLAlchemy. Conserve la trace
    auditable du cycle proposition -> confirmation -> execution (cf. design).
    Le repository ne commit pas : la transaction est geree par l'appelant.
    """

    @abstractmethod
    async def add(self, action: ChatAction) -> ChatAction:
        """Persiste une nouvelle action (etat `proposed`) puis la renvoie."""

    @abstractmethod
    async def get_by_id(self, action_id: UUID) -> ChatAction | None:
        """Renvoie l'action par son id, ou None si elle n'existe pas."""

    @abstractmethod
    async def list_proposed_by_conversation(self, conversation_id: UUID) -> list[ChatAction]:
        """Renvoie les actions encore `proposed` du fil (pour rejouer leur carte)."""

    @abstractmethod
    async def update(self, action: ChatAction) -> ChatAction:
        """Met a jour une action (status, deployment_id) puis la renvoie."""
