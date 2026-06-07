"""Tests unitaires de TemplateNotFoundForDeploymentException."""

import pytest

from app.deployment.domain.exceptions.template_not_found import (
    TemplateNotFoundForDeploymentException,
)
from app.shared.exceptions.domain_exception import DomainException


class TestTemplateNotFoundForDeploymentException:
    def test_est_une_domain_exception(self) -> None:
        exc = TemplateNotFoundForDeploymentException()

        assert isinstance(exc, DomainException)

    def test_porte_le_code_et_le_statut_404(self) -> None:
        exc = TemplateNotFoundForDeploymentException()

        assert exc.code == "TEMPLATE_NOT_FOUND_FOR_DEPLOYMENT"
        assert exc.http_status == 404

    def test_message_personnalisable(self) -> None:
        exc = TemplateNotFoundForDeploymentException("Version inconnue.")

        assert exc.message == "Version inconnue."

    def test_levee_attrapable(self) -> None:
        with pytest.raises(TemplateNotFoundForDeploymentException):
            raise TemplateNotFoundForDeploymentException()
