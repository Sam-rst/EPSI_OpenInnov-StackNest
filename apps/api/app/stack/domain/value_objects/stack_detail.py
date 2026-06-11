"""Value object StackDetail : vue agregee d'une stack (stack + services + liens)."""

from dataclasses import dataclass

from app.stack.domain.entities.stack import Stack
from app.stack.domain.entities.stack_link import StackLink
from app.stack.domain.entities.stack_service import StackService


@dataclass(frozen=True)
class StackDetail:
    """Agregat de lecture d'une stack et de ses membres, compose par le use case.

    L'entite `Stack` ne porte pas directement ses collections (cf. choix de
    chargement du `StackRepository` : `list_services` / `list_links` dedies, pour
    eviter le lazy-loading ORM en async). Le use case de detail (`GetStack`)
    compose donc cette vue en appelant le repository, et la couche presentation
    la projette en `StackResponse`.

    - `stack`    : la stack elle-meme (statut global, owner, libelle).
    - `services` : ses services, ordonnes par `order_index`.
    - `links`    : ses liens diriges entre services.
    """

    stack: Stack
    services: tuple[StackService, ...]
    links: tuple[StackLink, ...]
