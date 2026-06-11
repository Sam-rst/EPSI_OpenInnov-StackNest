"""Entite de domaine StackService : un service membre d'une stack."""

from dataclasses import dataclass, field
from typing import Any
from uuid import UUID

from app.stack.domain.enums.service_status import ServiceStatus

_MIN_PORT = 1
_MAX_PORT = 65535


@dataclass
class StackService:
    """Service appartenant a une stack, derive d'un template du catalogue.

    Entite mutable identifiee par `id`. L'`alias` est le nom du service dans la
    stack (cle compose, resolvable par DNS interne) : il doit etre unique au
    sein de la stack (contrainte base `(stack_id, alias)`) et permet d'ajouter
    plusieurs fois le meme template (ex. deux `db`). Son `service_status`, son
    `published_port` et son `container_ref` evoluent au run.

    Les guard clauses garantissent les invariants a la construction : alias et
    version non vides, port publie dans la plage TCP valide.

    - `stack_id`        : stack proprietaire (FK, cascade en base).
    - `template_id`     : template du catalogue dont derive l'image.
    - `version`         : libelle de version choisi (ex. `16`) -> image `repo:16`.
    - `alias`           : nom unique du service dans la stack (cle compose).
    - `params`          : valeurs des parametres de provisioning (JSON).
    - `published_port`  : port publie sur l'hote (None avant le run).
    - `container_ref`   : reference du conteneur une fois cree (None avant).
    - `service_status`  : etat courant du service.
    - `order_index`     : ordre d'affichage / d'ajout dans la stack.
    """

    id: UUID
    stack_id: UUID
    template_id: UUID
    version: str
    alias: str
    service_status: ServiceStatus
    order_index: int
    params: dict[str, Any] = field(default_factory=dict)
    published_port: int | None = None
    container_ref: str | None = None

    def __post_init__(self) -> None:
        if not self.alias.strip():
            raise ValueError("StackService.alias ne doit pas etre vide.")
        if not self.version.strip():
            raise ValueError("StackService.version ne doit pas etre vide.")
        if self.published_port is not None and not _MIN_PORT <= self.published_port <= _MAX_PORT:
            raise ValueError(
                f"StackService.published_port doit etre dans [{_MIN_PORT}, {_MAX_PORT}], "
                f"recu {self.published_port}."
            )
