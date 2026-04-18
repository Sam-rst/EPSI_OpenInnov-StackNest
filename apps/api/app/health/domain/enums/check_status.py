"""Statuts possibles d'un check de sante."""

from enum import StrEnum


class CheckStatus(StrEnum):
    """Statut d'un sous-service verifie par un HealthCheck.

    - `OK`      : le service repond correctement
    - `DOWN`    : le service ne repond pas ou a echoue (connexion, erreur applicative)
    - `TIMEOUT` : le check a depasse le delai imparti (soft fail, le service n'est
                  peut-etre pas down mais juste lent)
    """

    OK = "ok"
    DOWN = "down"
    TIMEOUT = "timeout"
