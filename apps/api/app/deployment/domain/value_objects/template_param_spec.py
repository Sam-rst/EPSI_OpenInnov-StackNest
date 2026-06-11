"""Value object TemplateParamSpec : descripteur d'un parametre de provisioning."""

from dataclasses import dataclass
from typing import Any

from app.catalog.domain.enums.param_type import ParamType

# Cle des choix d'un parametre SELECT dans la colonne `options` (JSON catalogue).
_CHOICES_KEY = "choices"


@dataclass(frozen=True)
class TemplateParamSpec:
    """Projection d'un parametre de template, vue par la feature deploiement.

    Decrit un parametre attendu par le provisioning (cf. catalogue) sans dependre
    de l'entite catalogue : le slice deploiement n'en consomme que la cle, le
    type, l'obligation et les options. Sert a deux choses :

    - valider la saisie a la creation (`DeploymentParamsValidator`) : presence des
      params requis, conformite au type et aux choix d'un `SELECT` ;
    - masquer les valeurs des params `secret` dans la reponse REST (`is_secret`).

    - `key`      : nom du parametre (cle dans `Deployment.params`).
    - `type`     : type metier (pilote la validation et le masquage secret).
    - `required` : vrai si une valeur non vide est obligatoire a la creation.
    - `options`  : JSON des choix possibles (parametre `SELECT`), sinon None.
    - `env_var`  : variable d'environnement du conteneur recevant la valeur du
      parametre (ex. `POSTGRES_DB`), ou `None` si le parametre ne configure aucune
      variable d'env. Consommee par le worker pour injecter la config saisie.
    - `default_value` : valeur par defaut du parametre (texte), appliquee a la
      creation quand un param requis non-secret est omis (cf. `CreateDeployment`),
      ou `None` si le template n'en declare aucune.
    """

    key: str
    type: ParamType
    required: bool
    options: dict[str, Any] | None
    env_var: str | None = None
    default_value: str | None = None

    def is_secret(self) -> bool:
        """Vrai si le parametre porte une valeur sensible (jamais reaffichee)."""
        return self.type is ParamType.SECRET

    def allowed_values(self) -> list[Any]:
        """Liste des valeurs autorisees d'un `SELECT`, vide pour les autres types."""
        if self.type is not ParamType.SELECT or not self.options:
            return []
        choices = self.options.get(_CHOICES_KEY)
        return list(choices) if isinstance(choices, list) else []
