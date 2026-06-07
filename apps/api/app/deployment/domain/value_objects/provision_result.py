"""Value object ProvisionResult : resultat d'un provisioning reussi."""

from dataclasses import dataclass

_MIN_PORT = 1
_MAX_PORT = 65535


@dataclass(frozen=True)
class ProvisionResult:
    """Coordonnees d'un conteneur fraichement provisionne, renvoyees par le port.

    Immutable : produit par `Provisioner.create` une fois le conteneur lance et
    le port publie. Le domaine s'en sert pour mettre a jour le `Deployment`
    (host + published_port) et exposer l'`AccessEndpoint`.

    - `host`          : hote d'execution ou tourne le conteneur.
    - `port`          : port publie sur l'hote (assigne par Docker).
    - `container_ref` : reference du conteneur (id/nom) pour les actions futures.
    """

    host: str
    port: int
    container_ref: str

    def __post_init__(self) -> None:
        if not self.host.strip():
            raise ValueError("ProvisionResult.host ne doit pas etre vide.")
        if not _MIN_PORT <= self.port <= _MAX_PORT:
            raise ValueError(
                f"ProvisionResult.port doit etre dans [{_MIN_PORT}, {_MAX_PORT}], recu {self.port}."
            )
        if not self.container_ref.strip():
            raise ValueError("ProvisionResult.container_ref ne doit pas etre vide.")
