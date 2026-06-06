"""Tests unitaires de l'enum TokenPurpose."""

from app.auth.domain.enums.token_purpose import TokenPurpose


class TestTokenPurpose:
    def test_valeurs_metier(self) -> None:
        assert TokenPurpose.ACCESS.value == "access"
        assert TokenPurpose.REFRESH.value == "refresh"
        assert TokenPurpose.VERIFY.value == "verify"
        assert TokenPurpose.RESET.value == "reset"
