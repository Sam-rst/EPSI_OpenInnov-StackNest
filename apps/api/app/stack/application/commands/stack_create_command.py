"""Commande applicative de creation d'une stack multi-services."""

from dataclasses import dataclass, field
from uuid import UUID

from app.stack.application.commands.stack_link_command import StackLinkCommand
from app.stack.application.commands.stack_service_command import StackServiceCommand


@dataclass(frozen=True)
class StackCreateCommand:
    """Donnees d'entree du use case `CreateStack` (DTO applicatif).

    Decouple la presentation (router/schema) du use case : la couche presentation
    traduit la requete HTTP + l'utilisateur authentifie en cette commande, en y
    injectant l'`owner_id` issu du jeton (jamais fourni par le client). Immutable,
    sans logique : la validation metier (alias, liens, cycles) est portee par le
    `StackValidator`, invoque par le use case.

    - `owner_id` : utilisateur authentifie proprietaire de la stack.
    - `name`     : libelle de la stack saisi par l'utilisateur.
    - `services` : services a composer (>= 1, alias uniques).
    - `links`    : liens diriges entre services (par alias).
    """

    owner_id: UUID
    name: str
    services: tuple[StackServiceCommand, ...]
    links: tuple[StackLinkCommand, ...] = field(default_factory=tuple)
