"""Value object TemplateProvisioning : descripteur de provisioning d'un template."""

from dataclasses import dataclass

from app.catalog.domain.enums.engine_kind import EngineKind


@dataclass(frozen=True)
class TemplateProvisioning:
    """Descripteur d'execution d'un template, vu par la feature deploiement.

    Projection minimale du template du catalogue (cf. design section 4) dont le
    use case a besoin pour decider s'il peut deployer et comment construire le
    conteneur. Le deploiement depend de ce VO via le port
    `TemplateProvisioningReader`, jamais directement du catalogue (inversion de
    dependance).

    - `image_repository` : depot de l'image Docker (ex. `postgres`). `None` quand
      le moteur n'est pas Docker (ex. Terraform : aucune image).
    - `internal_port`    : port ecoute dans le conteneur (ex. `5432`), ou `None`.
    - `secret_env`       : variable d'env recevant le mot de passe genere
      (ex. `POSTGRES_PASSWORD`), ou `None` si le template ne porte aucun secret.
    - `engine`           : moteur de provisioning (`docker` deployable au MVP,
      `terraform` rejete par la gate moteur — cf. design section 12).

    `image_repository` doit etre non vide pour un template Docker : la guard
    clause l'exige uniquement quand un libelle est fourni (un template Terraform
    porte legitimement `image_repository=None`).
    """

    image_repository: str | None
    internal_port: int | None
    secret_env: str | None
    engine: EngineKind

    def __post_init__(self) -> None:
        if self.image_repository is not None and not self.image_repository.strip():
            raise ValueError("TemplateProvisioning.image_repository ne doit pas etre vide.")

    def is_docker(self) -> bool:
        """Vrai si le template est materialisable par un conteneur Docker."""
        return self.engine is EngineKind.DOCKER

    def requires_secret(self) -> bool:
        """Vrai si le template declare une variable d'env recevant un secret."""
        return self.secret_env is not None
