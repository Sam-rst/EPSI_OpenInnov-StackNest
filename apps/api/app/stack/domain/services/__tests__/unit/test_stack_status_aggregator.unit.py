"""Tests unitaires de l'agregation du statut global d'une stack."""

import pytest

from app.stack.domain.enums.service_status import ServiceStatus
from app.stack.domain.enums.stack_status import StackStatus
from app.stack.domain.services.stack_status_aggregator import aggregate_stack_status


class TestAggregateStackStatus:
    def test_tous_running_donne_running(self) -> None:
        statuses = [ServiceStatus.RUNNING, ServiceStatus.RUNNING]

        assert aggregate_stack_status(statuses) is StackStatus.RUNNING

    def test_un_seul_failed_donne_failed(self) -> None:
        # Un service en echec prime : la stack est globalement `failed`.
        statuses = [ServiceStatus.RUNNING, ServiceStatus.FAILED]

        assert aggregate_stack_status(statuses) is StackStatus.FAILED

    def test_certains_running_sans_echec_donne_partial(self) -> None:
        statuses = [ServiceStatus.RUNNING, ServiceStatus.PROVISIONING]

        assert aggregate_stack_status(statuses) is StackStatus.PARTIAL

    def test_aucun_running_sans_echec_donne_partial(self) -> None:
        # Tant qu'aucun n'a echoue mais que tout n'est pas up, on reste partial.
        statuses = [ServiceStatus.PROVISIONING, ServiceStatus.PENDING]

        assert aggregate_stack_status(statuses) is StackStatus.PARTIAL

    def test_sans_service_leve_une_erreur(self) -> None:
        with pytest.raises(ValueError, match="au moins un service"):
            aggregate_stack_status([])
