"""Interface (port) du depot de stacks et de leurs services / liens."""

from abc import ABC, abstractmethod
from uuid import UUID

from app.stack.domain.entities.stack import Stack
from app.stack.domain.entities.stack_link import StackLink
from app.stack.domain.entities.stack_service import StackService


class StackRepository(ABC):
    """Contrat de persistance des stacks (source de verite Postgres).

    Implemente en infrastructure par un adaptateur SQLAlchemy. Les use cases en
    dependent par inversion : ils ignorent tout des modeles ORM.

    **Choix de chargement** : l'agregat n'est pas charge en entier par une
    methode unique ; les services et liens d'une stack sont exposes par des
    methodes dediees (`list_services`, `list_links`). Ce choix suit le pattern
    du slice chat (`add_message` / `list_messages`) : il evite le lazy-loading
    de relations ORM en contexte async (qui impose un eager-load explicite et
    une `AsyncSession` ouverte au moment de l'acces) et garde chaque methode a
    responsabilite unique. Le use case de detail (lot 2) compose lui-meme la
    vue en appelant `get_by_id` + `list_services` + `list_links`.

    `list_by_owner` renvoie les stacks d'un utilisateur (isolation par
    `owner_id`). Le repository ne commit pas : la transaction est geree par
    l'appelant (unit of work par requete). La suppression d'une stack emporte
    ses services et liens (cascade ON DELETE au niveau base).
    """

    @abstractmethod
    async def add(self, stack: Stack) -> Stack:
        """Persiste une nouvelle stack (etat initial `pending`) puis la renvoie."""

    @abstractmethod
    async def get_by_id(self, stack_id: UUID) -> Stack | None:
        """Renvoie la stack par son id, ou None si elle n'existe pas."""

    @abstractmethod
    async def list_by_owner(self, owner_id: UUID) -> list[Stack]:
        """Renvoie toutes les stacks appartenant a cet utilisateur."""

    @abstractmethod
    async def delete(self, stack_id: UUID) -> None:
        """Supprime la stack (cascade ses services et liens)."""

    @abstractmethod
    async def add_service(self, service: StackService) -> StackService:
        """Persiste un service rattache a une stack puis le renvoie."""

    @abstractmethod
    async def list_services(self, stack_id: UUID) -> list[StackService]:
        """Renvoie les services d'une stack, ordonnes par `order_index`."""

    @abstractmethod
    async def add_link(self, link: StackLink) -> StackLink:
        """Persiste un lien entre deux services d'une stack puis le renvoie."""

    @abstractmethod
    async def list_links(self, stack_id: UUID) -> list[StackLink]:
        """Renvoie les liens d'une stack."""
