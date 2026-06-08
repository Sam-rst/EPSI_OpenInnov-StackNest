"""Value object DeploymentName : nom de deploiement au format label DNS."""

import re
from dataclasses import dataclass

from app.deployment.domain.exceptions.invalid_deployment_name import (
    InvalidDeploymentNameException,
)

# Format type label DNS (RFC 1123) : minuscules + chiffres, tirets autorises a
# l'interieur uniquement, 1 a 63 caracteres. Borne le nom a un identifiant sain
# (sert de base au nom du conteneur Docker).
_LABEL_PATTERN = re.compile(r"^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$")
_MAX_LENGTH = 63


@dataclass(frozen=True)
class DeploymentName:
    """Nom de deploiement valide (label DNS), garanti a la construction.

    Immutable et auto-validant : la guard clause refuse tout nom hors format
    (majuscules, espaces, caracteres speciaux, tiret en tete/fin, longueur > 63).
    Le use case `CreateDeployment` instancie ce VO pour valider la saisie avant de
    persister le deploiement ; un nom invalide leve `InvalidDeploymentNameException`
    (HTTP 422 via le handler global).
    """

    value: str

    def __post_init__(self) -> None:
        if len(self.value) > _MAX_LENGTH or not _LABEL_PATTERN.fullmatch(self.value):
            raise InvalidDeploymentNameException()

    def __str__(self) -> str:
        return self.value
