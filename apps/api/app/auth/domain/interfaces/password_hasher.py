"""Interface (port) du service de hachage de mots de passe."""

from abc import ABC, abstractmethod

from app.auth.domain.value_objects.password import Password


class PasswordHasher(ABC):
    """Contrat de hachage/verification de mot de passe.

    Implemente en infrastructure par un adaptateur concret (bcrypt). Le domaine
    et les use cases dependent de cette abstraction, jamais d'une lib precise
    (inversion de dependance).
    """

    @abstractmethod
    def hash(self, password: Password) -> str:
        """Calcule l'empreinte d'un mot de passe en clair."""

    @abstractmethod
    def verify(self, password: Password, password_hash: str) -> bool:
        """Verifie qu'un mot de passe en clair correspond a une empreinte."""
