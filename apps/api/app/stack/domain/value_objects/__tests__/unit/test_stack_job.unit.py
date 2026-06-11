"""Tests unitaires du value object StackJob (enveloppe de job worker)."""

from uuid import uuid4

from app.stack.domain.enums.stack_job_kind import StackJobKind
from app.stack.domain.value_objects.stack_job import StackJob


class TestStackJob:
    def test_porte_le_type_et_l_identifiant_de_stack(self) -> None:
        stack_id = uuid4()

        job = StackJob(kind=StackJobKind.PROVISION, stack_id=stack_id)

        assert job.kind is StackJobKind.PROVISION
        assert job.stack_id == stack_id
