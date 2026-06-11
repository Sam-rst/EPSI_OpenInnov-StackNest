"""Tests unitaires de l'exception TemplateNotDeployableException."""

import pytest

from app.deployment.domain.exceptions.template_not_deployable import (
    TemplateNotDeployableException,
)
from app.shared.exceptions.domain_exception import DomainException


class TestTemplateNotDeployableException:
    def test_est_une_domain_exception(self) -> None:
        exc = TemplateNotDeployableException()

        assert isinstance(exc, DomainException)

    def test_porte_le_code_et_le_statut_409(self) -> None:
        exc = TemplateNotDeployableException()

        assert exc.code == "TEMPLATE_NOT_DEPLOYABLE"
        assert exc.http_status == 409

    def test_message_par_defaut_evoque_indisponibilite(self) -> None:
        exc = TemplateNotDeployableException()

        assert "disponible" in exc.message.lower()

    def test_message_personnalisable(self) -> None:
        exc = TemplateNotDeployableException("Runtime non deployable.")

        assert exc.message == "Runtime non deployable."

    def test_levee_attrapable(self) -> None:
        with pytest.raises(TemplateNotDeployableException):
            raise TemplateNotDeployableException()
