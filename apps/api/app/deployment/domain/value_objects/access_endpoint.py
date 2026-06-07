"""Value object AccessEndpoint : point d'acces publie d'un deploiement."""

from dataclasses import dataclass

_MIN_PORT = 1
_MAX_PORT = 65535


@dataclass(frozen=True)
class AccessEndpoint:
    """Adresse d'acces a une ressource deployee (hote + port publie).

    Immutable : decrit ou joindre le conteneur sur l'hote d'execution une fois
    le port publie (ex. `IP_B:32768`, accessible derriere le VPN). Guard clauses :
    host non vide, port dans la plage TCP valide.

    - `host` : adresse de l'hote d'execution (machine B).
    - `port` : port publie sur l'hote (assigne par Docker, ex. 32768+).
    """

    host: str
    port: int

    def __post_init__(self) -> None:
        if not self.host.strip():
            raise ValueError("AccessEndpoint.host ne doit pas etre vide.")
        if not _MIN_PORT <= self.port <= _MAX_PORT:
            raise ValueError(
                f"AccessEndpoint.port doit etre dans [{_MIN_PORT}, {_MAX_PORT}], recu {self.port}."
            )

    @property
    def url(self) -> str:
        """Adresse joignable `host:port` (sans schema — protocole dependant du template)."""
        return f"{self.host}:{self.port}"
