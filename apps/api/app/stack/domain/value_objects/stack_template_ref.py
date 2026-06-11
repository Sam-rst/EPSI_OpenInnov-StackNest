"""Value object StackTemplateRef : projection minimale d'un template du catalogue."""

from dataclasses import dataclass, field

from app.catalog.domain.enums.engine_kind import EngineKind


@dataclass(frozen=True)
class StackTemplateRef:
    """Reference resolue d'un template/version, vue par la feature stack.

    Projection minimale du template du catalogue dont la feature stack a besoin :

    - decider si un service est **ajoutable** a une stack (moteur Docker), a la
      creation (`CreateStack`) ;
    - **masquer** les params `secret` du service dans la reponse REST (presentation).

    La stack depend de ce VO via le port `StackTemplateReader` (inversion de
    dependance), jamais directement du catalogue.

    - `template_name`      : libelle lisible (ex. `PostgreSQL`), pour enrichir les
      messages d'erreur sans exposer l'UUID.
    - `engine`             : moteur de provisioning. Seuls les templates `docker`
      sont ajoutables a une stack (les Terraform, sans image, sont bloques — cf.
      design « volet catalogue filtre aux templates Docker actifs »).
    - `secret_param_keys`  : cles des parametres declares `secret` par le template
      (a masquer dans la reponse REST).
    """

    template_name: str
    engine: EngineKind
    secret_param_keys: frozenset[str] = field(default_factory=frozenset)

    def is_docker(self) -> bool:
        """Vrai si le template est materialisable par un conteneur Docker."""
        return self.engine is EngineKind.DOCKER
