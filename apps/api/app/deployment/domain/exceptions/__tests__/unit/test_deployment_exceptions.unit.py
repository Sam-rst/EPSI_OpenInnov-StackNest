"""Tests unitaires des exceptions metier de deploiement (code + http_status)."""

from app.deployment.domain.exceptions.deployment_not_found import (
    DeploymentNotFoundException,
)
from app.deployment.domain.exceptions.invalid_deployment_state import (
    InvalidDeploymentStateException,
)
from app.shared.exceptions.domain_exception import DomainException


class TestDeploymentNotFoundException:
    def test_est_une_domain_exception(self) -> None:
        assert issubclass(DeploymentNotFoundException, DomainException)

    def test_code_et_statut(self) -> None:
        exc = DeploymentNotFoundException()

        assert exc.code == "DEPLOYMENT_NOT_FOUND"
        assert exc.http_status == 404

    def test_message_personnalisable(self) -> None:
        exc = DeploymentNotFoundException("Introuvable pour cet utilisateur.")

        assert exc.message == "Introuvable pour cet utilisateur."


class TestInvalidDeploymentStateException:
    def test_est_une_domain_exception(self) -> None:
        assert issubclass(InvalidDeploymentStateException, DomainException)

    def test_code_et_statut(self) -> None:
        exc = InvalidDeploymentStateException()

        assert exc.code == "INVALID_DEPLOYMENT_STATE"
        assert exc.http_status == 409

    def test_message_personnalisable(self) -> None:
        exc = InvalidDeploymentStateException("Transition running -> pending interdite.")

        assert exc.message == "Transition running -> pending interdite."
