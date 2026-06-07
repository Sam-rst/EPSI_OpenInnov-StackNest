"""Tests unitaires de TokenSecretGenerator (secrets.token_urlsafe)."""

from app.deployment.domain.interfaces.secret_generator import SecretGenerator
from app.deployment.infrastructure.secret.token_secret_generator import (
    TokenSecretGenerator,
)


class TestTokenSecretGenerator:
    def test_implemente_le_port_secret_generator(self) -> None:
        assert isinstance(TokenSecretGenerator(), SecretGenerator)

    def test_genere_un_secret_non_vide(self) -> None:
        secret = TokenSecretGenerator().generate()

        assert secret
        assert secret.strip() == secret

    def test_genere_des_secrets_differents(self) -> None:
        generator = TokenSecretGenerator()

        first = generator.generate()
        second = generator.generate()

        assert first != second

    def test_longueur_minimale_robuste(self) -> None:
        # token_urlsafe(32) produit ~43 caracteres base64url : largement >= 32.
        secret = TokenSecretGenerator().generate()

        assert len(secret) >= 32

    def test_nombre_d_octets_configurable(self) -> None:
        short = TokenSecretGenerator(num_bytes=16).generate()
        long = TokenSecretGenerator(num_bytes=48).generate()

        assert len(long) > len(short)
