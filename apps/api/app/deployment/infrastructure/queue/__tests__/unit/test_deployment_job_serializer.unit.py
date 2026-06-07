"""Tests unitaires de la (de)serialisation d'un DeploymentJob pour la file arq."""

from uuid import UUID

import pytest

from app.deployment.domain.enums.job_kind import JobKind
from app.deployment.domain.value_objects.deployment_job import DeploymentJob
from app.deployment.infrastructure.queue.deployment_job_serializer import (
    deserialize_deployment_job,
    serialize_deployment_job,
)

_DEPLOYMENT_ID = UUID("11111111-1111-1111-1111-111111111111")


class TestSerializeDeploymentJob:
    def test_produit_un_dict_de_primitives_json(self) -> None:
        job = DeploymentJob(kind=JobKind.PROVISION, deployment_id=_DEPLOYMENT_ID)

        payload = serialize_deployment_job(job)

        assert payload == {
            "kind": "provision",
            "deployment_id": "11111111-1111-1111-1111-111111111111",
        }

    def test_serialise_chaque_kind(self) -> None:
        for kind in JobKind:
            job = DeploymentJob(kind=kind, deployment_id=_DEPLOYMENT_ID)

            assert serialize_deployment_job(job)["kind"] == kind.value


class TestDeserializeDeploymentJob:
    def test_reconstruit_le_value_object(self) -> None:
        payload = {
            "kind": "destroy",
            "deployment_id": "11111111-1111-1111-1111-111111111111",
        }

        job = deserialize_deployment_job(payload)

        assert job == DeploymentJob(kind=JobKind.DESTROY, deployment_id=_DEPLOYMENT_ID)

    def test_roundtrip_preserve_le_job(self) -> None:
        job = DeploymentJob(kind=JobKind.REGENERATE, deployment_id=_DEPLOYMENT_ID)

        assert deserialize_deployment_job(serialize_deployment_job(job)) == job

    def test_kind_inconnu_leve_value_error(self) -> None:
        payload = {"kind": "unknown", "deployment_id": str(_DEPLOYMENT_ID)}

        with pytest.raises(ValueError):
            deserialize_deployment_job(payload)
