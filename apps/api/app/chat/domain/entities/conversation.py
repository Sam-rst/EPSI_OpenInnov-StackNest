"""Entite de domaine Conversation : fil de discussion d'un utilisateur."""

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass
class Conversation:
    """Fil de discussion appartenant a un utilisateur (chat IA).

    Entite mutable identifiee par `id` : son `title` peut etre renomme et son
    `updated_at` evolue. Un utilisateur peut posseder plusieurs fils (CRUD
    minimal au MVP : creer / renommer / supprimer / switcher).

    Guard clause : titre non vide (un fil affiche toujours un libelle dans la
    sidebar). Les timestamps sont geres cote base (server_default) : None tant
    que l'entite n'a pas ete persistee.

    - `owner_id` : utilisateur proprietaire (isolation des acces).
    - `title`    : libelle du fil affiche dans la sidebar.
    """

    id: UUID
    owner_id: UUID
    title: str
    created_at: datetime | None = field(default=None)
    updated_at: datetime | None = field(default=None)

    def __post_init__(self) -> None:
        if not self.title.strip():
            raise ValueError("Conversation.title ne doit pas etre vide.")
