"""Tests unitaires de la (de)serialisation d'un StackJob pour la file arq."""

from uuid import UUID

import pytest

from app.stack.domain.enums.stack_job_kind import StackJobKind
from app.stack.domain.value_objects.stack_job import StackJob
from app.stack.infrastructure.queue.stack_job_serializer import (
    deserialize_stack_job,
    serialize_stack_job,
)

_STACK_ID = UUID("11111111-1111-1111-1111-111111111111")


class TestStackJobSerializer:
    def test_roundtrip(self) -> None:
        job = StackJob(kind=StackJobKind.PROVISION, stack_id=_STACK_ID)

        restored = deserialize_stack_job(serialize_stack_job(job))

        assert restored == job

    def test_reduit_a_des_primitives(self) -> None:
        payload = serialize_stack_job(StackJob(kind=StackJobKind.DESTROY, stack_id=_STACK_ID))

        assert payload == {"kind": "destroy", "stack_id": str(_STACK_ID)}

    def test_kind_inconnu_leve(self) -> None:
        with pytest.raises(ValueError):
            deserialize_stack_job({"kind": "inconnu", "stack_id": str(_STACK_ID)})
