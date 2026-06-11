"""Entite de domaine Stack : projet multi-services deploye via docker compose."""

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID

from app.stack.domain.enums.stack_status import StackStatus

# Etats terminaux : aucune transition sortante possible.
_TERMINAL_STATUSES = frozenset({StackStatus.DESTROYED})


@dataclass
class Stack:
    """Stack multi-services composee par un utilisateur depuis le catalogue.

    Entite mutable identifiee par `id` : son `status` evolue au fil du cycle de
    vie (provisioning, run, destroy). Une stack agrege N `StackService` lies par
    des `StackLink` ; ces collections sont chargees par des methodes dediees du
    repository (cf. `StackRepository`), non portees directement par l'entite,
    pour rester independant du detail de chargement ORM (async).

    Les guard clauses garantissent les invariants a la construction : nom non
    vide.

    - `owner_id`   : utilisateur proprietaire (controle d'autorisation / isolation).
    - `name`       : libelle saisi par l'utilisateur.
    - `status`     : etat global courant (agregat des services).
    - `created_at` / `updated_at` : geres cote base (None tant que non persiste).
    """

    id: UUID
    owner_id: UUID
    name: str
    status: StackStatus
    created_at: datetime | None = field(default=None)
    updated_at: datetime | None = field(default=None)

    def __post_init__(self) -> None:
        if not self.name.strip():
            raise ValueError("Stack.name ne doit pas etre vide.")

    def is_terminal(self) -> bool:
        """Vrai si la stack est dans un etat terminal (plus de transition)."""
        return self.status in _TERMINAL_STATUSES
