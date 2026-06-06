"""Adaptateur de hachage de mot de passe base sur bcrypt."""

import bcrypt

from app.auth.domain.interfaces.password_hasher import PasswordHasher
from app.auth.domain.value_objects.password import Password

# Cout (log2 du nombre de tours) : >= 12 recommande. Plus haut = plus lent a
# casser mais aussi a verifier. 12 est un bon compromis securite/perf MVP.
_DEFAULT_COST = 12


class BcryptPasswordHasher(PasswordHasher):
    """Implementation de PasswordHasher via la lib `bcrypt`.

    bcrypt integre un sel aleatoire par hash (deux hash du meme mot de passe
    different) et un facteur de cout configurable. On encode/decode en UTF-8 ;
    bcrypt tronque au-dela de 72 octets, ce qui reste hors de portee de la
    politique de mots de passe MVP.
    """

    def __init__(self, cost: int = _DEFAULT_COST) -> None:
        self._cost = cost

    def hash(self, password: Password) -> str:
        salt = bcrypt.gensalt(rounds=self._cost)
        digest = bcrypt.hashpw(password.value.encode("utf-8"), salt)
        return digest.decode("utf-8")

    def verify(self, password: Password, password_hash: str) -> bool:
        return bcrypt.checkpw(password.value.encode("utf-8"), password_hash.encode("utf-8"))
