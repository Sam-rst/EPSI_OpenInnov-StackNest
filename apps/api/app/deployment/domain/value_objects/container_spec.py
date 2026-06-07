"""Value object ContainerSpec : specification declarative d'un conteneur a lancer."""

from dataclasses import dataclass, field

_MIN_PORT = 1
_MAX_PORT = 65535


@dataclass(frozen=True)
class ContainerSpec:
    """Description complete et figee d'un conteneur a provisionner.

    Immutable : produit par le `ContainerSpecFactory` puis transmis tel quel au
    `Provisioner`. Le domaine ne raisonne que sur cette specification, jamais sur
    l'API Docker. Guard clauses : image taguee (allowlist `repo:version`),
    limites positives, ports valides.

    Securite (cf. design section 8) : l'image est toujours de la forme
    `image_repository:version` derivee du catalogue — jamais une image arbitraire.
    Les secrets injectes dans `env` ne doivent jamais etre loggues.

    - `image`         : image taguee, ex. `postgres:16`.
    - `env`           : variables d'environnement (peut contenir le secret genere).
    - `command`       : surcharge de la commande du conteneur (None = defaut image).
    - `internal_port` : port ecoute dans le conteneur (None = pas de port a publier).
    - `cpu_limit`     : plafond CPU en nombre de coeurs (> 0).
    - `mem_limit`     : plafond memoire au format Docker (ex. `512m`, `1g`).
    - `labels`        : labels Docker (ex. `stacknest.deployment_id` pour le GC).
    """

    image: str
    env: dict[str, str] = field(default_factory=dict)
    command: list[str] | None = None
    internal_port: int | None = None
    cpu_limit: float = 1.0
    mem_limit: str = "512m"
    labels: dict[str, str] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.image.strip():
            raise ValueError("ContainerSpec.image ne doit pas etre vide.")
        if ":" not in self.image:
            raise ValueError(
                f"ContainerSpec.image doit etre taguee (repo:version), recu {self.image!r}."
            )
        if self.internal_port is not None and not _MIN_PORT <= self.internal_port <= _MAX_PORT:
            raise ValueError(
                f"ContainerSpec.internal_port doit etre dans [{_MIN_PORT}, {_MAX_PORT}], "
                f"recu {self.internal_port}."
            )
        if self.cpu_limit <= 0:
            raise ValueError("ContainerSpec.cpu_limit doit etre strictement positif.")
        if not self.mem_limit.strip():
            raise ValueError("ContainerSpec.mem_limit ne doit pas etre vide.")
        if self.command is not None and not self.command:
            raise ValueError("ContainerSpec.command ne doit pas etre une liste vide.")
