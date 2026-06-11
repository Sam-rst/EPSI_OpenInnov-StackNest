"""Entite de domaine Template : fiche d'une ressource provisionnable (agregat)."""

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID

from app.catalog.domain.entities.template_param import TemplateParam
from app.catalog.domain.entities.template_version import TemplateVersion
from app.catalog.domain.enums.engine_kind import EngineKind
from app.catalog.domain.enums.template_category import TemplateCategory
from app.catalog.domain.value_objects.slug import Slug


@dataclass
class Template:
    """Ressource provisionnable du catalogue (racine d'agregat).

    Entite identifiee par `id`, qui porte ses `versions` et `params` (agregat).
    Les guard clauses garantissent les invariants d'affichage : libelles non
    vides. Le `slug` est un value object garantissant le format de l'identifiant
    public.

    - `popular`   : mis en avant dans le catalogue.
    - `is_active` : masque un template sans le supprimer (defaut true).
    - `engine`    : moteur de provisioning (`docker` par defaut, `terraform`
      pour les ressources sans image — VM, reseau, bucket...).
    - `versions`  : versions disponibles (vide a la creation).
    - `params`    : parametres de provisioning (vide a la creation).

    Descripteur de provisioning (optionnel, consomme par la feature deploiement
    pour construire un conteneur Docker) :

    - `image_repository`      : depot de l'image Docker (ex. `postgres`). L'image
      effective est `{image_repository}:{version}`.
    - `internal_port`         : port ecoute dans le conteneur (ex. `5432`).
    - `secret_env`            : nom de la variable d'environnement recevant le mot
      de passe genere (ex. `POSTGRES_PASSWORD`) ; `None` si aucun secret.
    - `command`               : commande de demarrage du conteneur (surcharge la
      commande par defaut de l'image). `None` = commande par defaut. Ex. Keycloak,
      dont l'image affiche l'aide et sort sans `["start-dev"]`.
    - `secret_value_template` : gabarit de la VALEUR injectee dans `secret_env`.
      `None` = la valeur est le secret brut (comportement par defaut). Sinon, la
      valeur est `secret_value_template.format(secret=<secret genere>)` ; le gabarit
      n'accepte QUE le placeholder `{secret}`. Ex. Neo4j : `"neo4j/{secret}"` car
      `NEO4J_AUTH` attend la forme `user/password`.
    - `is_deployable`         : `False` masque le template du deploiement tout en le
      laissant visible au catalogue (etiquette « Bientot disponible »). Defaut
      `True`. Ex. runtimes langage (Node, Python, Go, PHP) : aucun service
      long-running utile au MVP.
    """

    id: UUID
    slug: Slug
    name: str
    icon: str
    category: TemplateCategory
    provider: str
    description: str
    popular: bool = False
    tags: list[str] = field(default_factory=list)
    is_active: bool = True
    engine: EngineKind = field(default=EngineKind.DOCKER)
    versions: list[TemplateVersion] = field(default_factory=list)
    params: list[TemplateParam] = field(default_factory=list)
    image_repository: str | None = field(default=None)
    internal_port: int | None = field(default=None)
    secret_env: str | None = field(default=None)
    command: list[str] | None = field(default=None)
    secret_value_template: str | None = field(default=None)
    is_deployable: bool = True
    created_at: datetime | None = field(default=None)
    updated_at: datetime | None = field(default=None)

    def __post_init__(self) -> None:
        if not self.name.strip():
            raise ValueError("Template.name ne doit pas etre vide.")
        if not self.icon.strip():
            raise ValueError("Template.icon ne doit pas etre vide.")
        if not self.provider.strip():
            raise ValueError("Template.provider ne doit pas etre vide.")
        if not self.description.strip():
            raise ValueError("Template.description ne doit pas etre vide.")
