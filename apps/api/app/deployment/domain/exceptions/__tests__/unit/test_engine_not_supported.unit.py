"""Tests unitaires de l'exception EngineNotSupportedException."""

import pytest

from app.deployment.domain.exceptions.engine_not_supported import (
    EngineNotSupportedException,
)
from app.shared.exceptions.domain_exception import DomainException


class TestEngineNotSupportedException:
    def test_est_une_domain_exception(self) -> None:
        exc = EngineNotSupportedException()

        assert isinstance(exc, DomainException)

    def test_porte_le_code_et_le_statut_409(self) -> None:
        exc = EngineNotSupportedException()

        assert exc.code == "ENGINE_NOT_SUPPORTED"
        assert exc.http_status == 409

    def test_message_par_defaut_evoque_terraform_a_venir(self) -> None:
        exc = EngineNotSupportedException()

        assert "Terraform" in exc.message

    def test_message_personnalisable(self) -> None:
        exc = EngineNotSupportedException("Moteur inconnu.")

        assert exc.message == "Moteur inconnu."

    def test_levee_attrapable(self) -> None:
        with pytest.raises(EngineNotSupportedException):
            raise EngineNotSupportedException()
