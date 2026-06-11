"""Commande applicative : un lien dirige entre deux services par leurs alias."""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class StackLinkCommand:
    """Descriptif d'un lien entre services de la stack a creer (DTO applicatif).

    Sous-commande de `StackCreateCommand`, immutable et sans logique. Le lien est
    exprime cote saisie par les **alias** (lisibles par l'utilisateur), pas par
    les ids techniques : le use case `CreateStack` resout les alias en ids une
    fois les services persistes.

    - `from_alias`    : alias du service consommateur (qui recoit les variables).
    - `to_alias`      : alias du service fournisseur (dont on derive les variables).
    - `var_mappings`  : mapping `{ ENV_VAR : expression }` (resolu cote worker).
    """

    from_alias: str
    to_alias: str
    var_mappings: dict[str, str] = field(default_factory=dict)
