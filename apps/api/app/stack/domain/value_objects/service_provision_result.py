"""Value object ServiceProvisionResult : coordonnees d'un service provisionne."""

from dataclasses import dataclass

_MIN_PORT = 1
_MAX_PORT = 65535


@dataclass(frozen=True)
class ServiceProvisionResult:
    """Coordonnees d'un service de stack apres `docker compose up`, par alias.

    Immutable : produit par le `StackProvisioner` une fois les conteneurs lances
    et les ports publies. Le worker s'en sert pour mettre a jour chaque
    `StackService` (published_port + container_ref) et exposer son acces.

    - `alias`          : alias du service dans la stack (cle compose).
    - `host`           : hote ou tourne le conteneur (ex. `localhost`).
    - `published_port` : port publie sur l'hote (assigne par Docker), ou `None`
      si le service ne publie aucun port (pas de `internal_port`).
    - `container_ref`  : reference du conteneur compose (id/nom) une fois cree.
    """

    alias: str
    host: str
    container_ref: str
    published_port: int | None = None

    def __post_init__(self) -> None:
        if not self.alias.strip():
            raise ValueError("ServiceProvisionResult.alias ne doit pas etre vide.")
        if not self.host.strip():
            raise ValueError("ServiceProvisionResult.host ne doit pas etre vide.")
        if not self.container_ref.strip():
            raise ValueError("ServiceProvisionResult.container_ref ne doit pas etre vide.")
        if self.published_port is not None and not _MIN_PORT <= self.published_port <= _MAX_PORT:
            raise ValueError(
                f"ServiceProvisionResult.published_port doit etre dans "
                f"[{_MIN_PORT}, {_MAX_PORT}], recu {self.published_port}."
            )
