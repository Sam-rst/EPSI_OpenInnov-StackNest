"""Commandes d'entree des use cases d'ecriture du catalogue (create/update).

Ces dataclasses sont l'API interne des use cases : la presentation traduit les
schemas HTTP en commandes, le use case les materialise en entites de domaine.
Decouple ainsi le contrat HTTP de la logique metier.
"""

from dataclasses import dataclass, field
from datetime import date
from typing import Any

from app.catalog.domain.enums.engine_kind import EngineKind
from app.catalog.domain.enums.param_type import ParamType
from app.catalog.domain.enums.template_category import TemplateCategory


@dataclass(frozen=True)
class VersionSpec:
    """Specification d'une version a creer/mettre a jour sur un template."""

    version: str
    is_default: bool
    is_lts: bool
    eol_date: date | None


@dataclass(frozen=True)
class ParamSpec:
    """Specification d'un parametre a creer/mettre a jour sur un template.

    `env_var` (optionnel) : variable d'environnement du conteneur recevant la
    valeur du parametre (ex. `POSTGRES_DB`), ou `None` si le parametre ne
    configure aucune variable d'env (port, memoire, service sans variable connue).
    """

    key: str
    label: str
    type: ParamType
    required: bool
    default_value: str | None
    options: dict[str, Any] | None
    order_index: int
    env_var: str | None = None


@dataclass(frozen=True)
class TemplateCommand:
    """Donnees completes d'un template pour la creation ou la mise a jour."""

    slug: str
    name: str
    icon: str
    category: TemplateCategory
    provider: str
    description: str
    popular: bool
    tags: list[str]
    is_active: bool
    engine: EngineKind = EngineKind.DOCKER
    versions: list[VersionSpec] = field(default_factory=list)
    params: list[ParamSpec] = field(default_factory=list)
    image_repository: str | None = None
    internal_port: int | None = None
    secret_env: str | None = None
    command: list[str] | None = None
    secret_value_template: str | None = None
    is_deployable: bool = True
