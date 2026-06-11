"""Value object StackEvent : evenement de progression d'une stack, diffuse en SSE."""

from dataclasses import dataclass

from app.stack.domain.enums.service_status import ServiceStatus
from app.stack.domain.enums.stack_status import StackStatus


@dataclass(frozen=True)
class StackEvent:
    """Evenement de cycle de vie publie sur le canal `stack:{id}` (cf. spec SSE).

    Immutable : represente une transition observable par l'UI via SSE, a deux
    niveaux (cf. spec « Lifecycle 2 niveaux ») :

    - **niveau stack** (`alias=None`) : porte le `stack_status` global agrege.
    - **niveau service** (`alias` renseigne) : porte le `service_status` du
      service, et son `access_url` (`host:port` publie) une fois `running`.

    Securite (cf. spec section « Securite ») : un `StackEvent` ne transporte
    **jamais** de secret. Les secrets generes worker-side restent dans
    l'environnement des conteneurs ; ils ne sont ni persistes ni diffuses.

    - `stack_status`   : nouvel etat global de la stack (toujours present).
    - `alias`          : service concerne (`None` = event au niveau stack).
    - `service_status` : etat du service (uniquement sur un event de service).
    - `message`        : libelle humain optionnel (progression, cause d'echec).
    - `access_url`     : `host:port` d'acces du service (a l'etat running).
    """

    stack_status: StackStatus
    alias: str | None = None
    service_status: ServiceStatus | None = None
    message: str | None = None
    access_url: str | None = None

    def is_service_level(self) -> bool:
        """Vrai si l'event concerne un service precis (alias renseigne)."""
        return self.alias is not None
