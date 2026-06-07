"""Implementation du port SecretGenerator via `secrets.token_urlsafe`."""

import secrets

from app.deployment.domain.interfaces.secret_generator import SecretGenerator

_DEFAULT_NUM_BYTES = 32


class TokenSecretGenerator(SecretGenerator):
    """Genere un secret aleatoire cryptographiquement sur (URL-safe).

    S'appuie sur `secrets.token_urlsafe`, base sur le CSPRNG du systeme : adapte a
    un mot de passe imprevisible injecte en env conteneur. `num_bytes` octets
    d'entropie (32 par defaut, soit ~43 caracteres base64url) — robuste contre le
    brute-force. Le secret produit n'est jamais loggue ni persiste en clair
    (cf. design section 8).
    """

    def __init__(self, num_bytes: int = _DEFAULT_NUM_BYTES) -> None:
        self._num_bytes = num_bytes

    def generate(self) -> str:
        return secrets.token_urlsafe(self._num_bytes)
