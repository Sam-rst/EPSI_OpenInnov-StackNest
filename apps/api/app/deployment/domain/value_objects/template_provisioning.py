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
    - `command`          : commande de demarrage du conteneur (None = defaut image).
      Ex. Keycloak : `("start-dev",)`, sans quoi l'image affiche l'aide et sort.
    - `secret_value_template` : gabarit de la VALEUR injectee dans `secret_env`.
      None = la valeur est le secret brut. Sinon, `resolve_secret_value` formate le
      secret via ce gabarit, qui n'accepte QUE le placeholder `{secret}`. Ex. Neo4j :
      `"neo4j/{secret}"` car `NEO4J_AUTH` attend la forme `user/password`.
    - `is_deployable`    : `False` = template visible au catalogue mais refuse au
      deploiement (gate use case `CreateDeployment`). Defaut `True`.

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
    command: tuple[str, ...] | None = None
    secret_value_template: str | None = None
    is_deployable: bool = True

    def __post_init__(self) -> None:
        if self.image_repository is not None and not self.image_repository.strip():
            raise ValueError("TemplateProvisioning.image_repository ne doit pas etre vide.")

    def is_docker(self) -> bool:
        """Vrai si le template est materialisable par un conteneur Docker."""
        return self.engine is EngineKind.DOCKER

    def requires_secret(self) -> bool:
        """Vrai si le template declare une variable d'env recevant un secret."""
        return self.secret_env is not None

    def resolve_secret_value(self, secret: str) -> str:
        """Valeur a injecter dans `secret_env` a partir du secret genere worker-side.

        Sans gabarit (`secret_value_template` None), la valeur est le secret brut
        (comportement par defaut). Avec gabarit, la valeur est le secret formate via
        `secret_value_template.format(secret=...)`.

        Securite (invariant #85) : le seul materiau secret reste le secret genere ;
        le gabarit ne fait que le mettre en forme et n'accepte QUE le placeholder
        `{secret}`. Tout autre placeholder leve `ValueError` (jamais d'autre cle qui
        casserait le formatage ou fuiterait une donnee). La valeur n'est jamais
        loggee.
        """
        if self.secret_value_template is None:
            return secret
        try:
            return self.secret_value_template.format(secret=secret)
        except (KeyError, IndexError) as error:
            raise ValueError(
                "TemplateProvisioning.secret_value_template n'accepte que le placeholder {secret}."
            ) from error

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
