"""Value object TemplateProvisioning : descripteur de provisioning d'un template."""

from dataclasses import dataclass, field

from app.catalog.domain.enums.engine_kind import EngineKind
from app.deployment.domain.value_objects.template_param_spec import TemplateParamSpec

# Nom du compte de connexion par defaut de chaque image de base de donnees, quand
# StackNest ne fixe PAS de variable d'utilisateur (`POSTGRES_USER` & co. absentes
# du provisioning) : le conteneur retombe alors sur le superutilisateur de l'image.
# Sert a afficher le `username` dans les acces (le mot de passe seul ne suffit pas
# a se connecter). Images hors de cette table : pas de compte par defaut connu.
_DEFAULT_CONNECTION_USERNAMES = {
    "postgres": "postgres",
    "mysql": "root",
    "mariadb": "root",
    "mongo": "root",
}


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
    - `template_name`    : libelle lisible du template (ex. `PostgreSQL`), expose
      dans la reponse REST pour eviter d'afficher l'UUID cote UI.
    - `params`           : descripteurs des parametres attendus (cle/type/requis/
      options). Pilotent la validation a la creation et le masquage des secrets
      dans la reponse REST.

    `image_repository` doit etre non vide pour un template Docker : la guard
    clause l'exige uniquement quand un libelle est fourni (un template Terraform
    porte legitimement `image_repository=None`).
    """

    image_repository: str | None
    internal_port: int | None
    secret_env: str | None
    engine: EngineKind
    template_name: str = ""
    params: tuple[TemplateParamSpec, ...] = field(default_factory=tuple)

    def __post_init__(self) -> None:
        if self.image_repository is not None and not self.image_repository.strip():
            raise ValueError("TemplateProvisioning.image_repository ne doit pas etre vide.")

    def is_docker(self) -> bool:
        """Vrai si le template est materialisable par un conteneur Docker."""
        return self.engine is EngineKind.DOCKER

    def requires_secret(self) -> bool:
        """Vrai si le template declare une variable d'env recevant un secret."""
        return self.secret_env is not None

    def secret_param_keys(self) -> frozenset[str]:
        """Cles des parametres de type `secret` (a masquer dans la reponse REST)."""
        return frozenset(spec.key for spec in self.params if spec.is_secret())

    def connection_username(self) -> str | None:
        """Compte de connexion par defaut de l'image, ou `None` si inconnu.

        Le mot de passe genere seul ne suffit pas a se connecter a la ressource :
        l'UI a besoin du nom d'utilisateur associe. Comme StackNest ne fixe pas de
        variable d'utilisateur au provisioning, ce compte est le superutilisateur
        par defaut de l'image (ex. `postgres` pour Postgres). Derive de l'image,
        donc deterministe et non persiste.
        """
        if self.image_repository is None:
            return None
        return _DEFAULT_CONNECTION_USERNAMES.get(self.image_repository)
