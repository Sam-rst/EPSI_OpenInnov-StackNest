"""Entite de domaine Deployment : ressource Docker provisionnee par un utilisateur."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
from uuid import UUID

from app.deployment.domain.enums.deployment_status import DeploymentStatus

_MIN_PORT = 1
_MAX_PORT = 65535

# Etats terminaux : aucune transition sortante possible (cf. design section 7).
_TERMINAL_STATUSES = frozenset({DeploymentStatus.DESTROYED})


@dataclass
class Deployment:
    """Ressource Docker provisionnee a partir d'un template du catalogue.

    Entite mutable identifiee par `id` : son `status`, son `host` et son
    `published_port` evoluent au fil du cycle de vie (provisioning, run, stop,
    destroy). Au MVP, un deploiement = une seule ressource (1 conteneur).

    Les guard clauses garantissent les invariants a la construction : libelles
    non vides, port publie dans la plage TCP valide.

    - `owner_id`         : utilisateur proprietaire (controle d'autorisation).
    - `template_id`      : template du catalogue dont derive l'image.
    - `template_version` : libelle de version choisi (ex. `16`) -> image `repo:16`.
    - `name`             : libelle saisi par l'utilisateur.
    - `status`           : etat courant dans la machine a etats.
    - `params`           : valeurs des parametres de provisioning (JSON).
    - `host`             : hote d'execution une fois provisionne (None avant).
    - `published_port`   : port publie sur l'hote (None avant le run).
    """

    id: UUID
    owner_id: UUID
    template_id: UUID
    template_version: str
    name: str
    status: DeploymentStatus
    params: dict[str, Any] = field(default_factory=dict)
    host: str | None = None
    published_port: int | None = None
    created_at: datetime | None = field(default=None)
    updated_at: datetime | None = field(default=None)

    def __post_init__(self) -> None:
        if not self.name.strip():
            raise ValueError("Deployment.name ne doit pas etre vide.")
        if not self.template_version.strip():
            raise ValueError("Deployment.template_version ne doit pas etre vide.")
        if self.published_port is not None and not _MIN_PORT <= self.published_port <= _MAX_PORT:
            raise ValueError(
                f"Deployment.published_port doit etre dans [{_MIN_PORT}, {_MAX_PORT}], "
                f"recu {self.published_port}."
            )

    def is_terminal(self) -> bool:
        """Vrai si le deploiement est dans un etat terminal (plus de transition)."""
        return self.status in _TERMINAL_STATUSES
