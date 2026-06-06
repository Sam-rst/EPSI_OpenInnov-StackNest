"""Interface (port) du limiteur de debit (rate limiting)."""

from abc import ABC, abstractmethod


class RateLimiter(ABC):
    """Contrat de limitation de debit par cle.

    Protege les endpoints sensibles (login, register, reset) du brute-force.
    Implemente en infrastructure par un adaptateur Redis (compteur partage
    entre les instances de l'API).
    """

    @abstractmethod
    async def is_allowed(self, key: str) -> bool:
        """Enregistre une tentative pour `key` et indique si elle est autorisee.

        Renvoie False des que le nombre de tentatives dans la fenetre courante
        depasse la limite configuree.
        """
