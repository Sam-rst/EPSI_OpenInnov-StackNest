"""Tests unitaires de l'entite de domaine `Stack` (guard clauses)."""

from uuid import uuid4

import pytest

from app.stack.domain.entities.stack import Stack
from app.stack.domain.enums.stack_status import StackStatus


def _stack(*, name: str = "ma-stack", status: StackStatus = StackStatus.PENDING) -> Stack:
    return Stack(id=uuid4(), owner_id=uuid4(), name=name, status=status)


class TestGuardClauses:
    def test_construit_une_stack_valide(self) -> None:
        stack = _stack()

        assert stack.name == "ma-stack"
        assert stack.status is StackStatus.PENDING
        assert stack.created_at is None
        assert stack.updated_at is None

    def test_refuse_un_nom_vide(self) -> None:
        with pytest.raises(ValueError, match="name ne doit pas etre vide"):
            _stack(name="")

    def test_refuse_un_nom_blanc(self) -> None:
        with pytest.raises(ValueError, match="name ne doit pas etre vide"):
            _stack(name="   ")


class TestIsTerminal:
    def test_destroyed_est_terminal(self) -> None:
        assert _stack(status=StackStatus.DESTROYED).is_terminal() is True

    @pytest.mark.parametrize(
        "status",
        [
            StackStatus.PENDING,
            StackStatus.PROVISIONING,
            StackStatus.RUNNING,
            StackStatus.PARTIAL,
            StackStatus.FAILED,
            StackStatus.DESTROYING,
        ],
    )
    def test_les_autres_statuts_ne_sont_pas_terminaux(self, status: StackStatus) -> None:
        assert _stack(status=status).is_terminal() is False
