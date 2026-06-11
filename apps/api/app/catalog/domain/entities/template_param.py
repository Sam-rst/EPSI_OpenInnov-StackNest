"""Entite de domaine TemplateParam : parametre de provisioning d'un template."""

from dataclasses import dataclass
from typing import Any
from uuid import UUID

from app.catalog.domain.enums.param_type import ParamType


@dataclass
class TemplateParam:
    """Parametre de configuration d'un template (pilote le formulaire UI).

    Entite identifiee par `id`, rattachee a un template parent. Les guard
    clauses garantissent un parametre exploitable : cle et libelle non vides,
    ordre positif, et options presentes pour un parametre de type `SELECT`.

    - `type`          : pilote le rendu du formulaire cote UI.
    - `default_value` : valeur par defaut serialisee en texte (nullable).
    - `options`       : choix possibles d'un parametre `SELECT` (JSON, nullable).
    - `order_index`   : ordre d'affichage dans le formulaire (>= 0).
    - `env_var`       : variable d'environnement du conteneur recevant la valeur du
      parametre (ex. `POSTGRES_DB`), ou `None` si le parametre ne configure aucune
      variable d'env (port, memoire, ou service sans variable upstream connue).
    """

    id: UUID
    key: str
    label: str
    type: ParamType
    required: bool
    default_value: str | None
    options: dict[str, Any] | None
    order_index: int
    env_var: str | None = None

    def __post_init__(self) -> None:
        if not self.key.strip():
            raise ValueError("TemplateParam.key ne doit pas etre vide.")
        if not self.label.strip():
            raise ValueError("TemplateParam.label ne doit pas etre vide.")
        if self.order_index < 0:
            raise ValueError("TemplateParam.order_index doit etre >= 0.")
        if self.type is ParamType.SELECT and not self.options:
            raise ValueError("Un parametre SELECT doit fournir des options.")
