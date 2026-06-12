"""Value objects de composition de stack proposee par le chat (services + liens).

Forme VALIDEE d'une proposition `compose_stack`, transportee du moteur de chat
vers le port `StackActions` (puis vers le use case `CreateStack` du slice stack).
Decouple le chat des commandes applicatives du slice stack : la gate
(`ActionArgsGate`) produit ces VO apres validation contre le catalogue reel et
le `StackValidator`, et l'adaptateur les traduit en `StackCreateCommand`.

Invariant securite : aucun secret n'y transite. Les params `secret` d'un
template sont generes worker-side au provisioning — la gate les exclut des
`params` (jamais demandes au LLM, jamais affiches ni persistes cote chat).
"""

from dataclasses import dataclass, field
from typing import Any
from uuid import UUID


@dataclass(frozen=True)
class StackServiceSpec:
    """Un service membre d'une stack proposee, valide contre le catalogue.

    - `template_id` : template Docker reel et deployable du catalogue.
    - `alias`       : nom unique du service dans la stack (cle compose / DNS interne).
    - `version`     : version resolue (defaut du template si non precisee).
    - `params`      : params NON secrets fournis (les secrets sont exclus).
    """

    template_id: UUID
    alias: str
    version: str
    params: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class StackLinkSpec:
    """Un lien dirige entre deux services d'une stack proposee, par alias.

    - `from_alias`   : alias du service consommateur (qui recoit les variables).
    - `to_alias`     : alias du service fournisseur (dont on derive les variables).
    - `var_mappings` : mapping `{ ENV_VAR : expression }` (`{to.alias}`, `{to.port}`,
      `{to.username}`, `{to.db_name}`, `{to.secret}`), resolu worker-side.
    """

    from_alias: str
    to_alias: str
    var_mappings: dict[str, str] = field(default_factory=dict)
