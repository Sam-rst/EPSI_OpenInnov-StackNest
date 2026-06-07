"""Interface (port) de generation de secrets de deploiement."""

from abc import ABC, abstractmethod


class SecretGenerator(ABC):
    """Contrat de generation d'un mot de passe aleatoire fort.

    Port du domaine deploiement : le secret est genere au PROVISION par le worker
    (jamais a la creation ni persiste en clair, cf. design section 8), injecte
    dans l'env du conteneur et diffuse une seule fois via l'event « running ».
    Implemente en infrastructure par un adaptateur cryptographiquement sur
    (`TokenSecretGenerator`, base sur `secrets.token_urlsafe`).
    """

    @abstractmethod
    def generate(self) -> str:
        """Renvoie un secret aleatoire imprevisible (jamais loggue)."""
