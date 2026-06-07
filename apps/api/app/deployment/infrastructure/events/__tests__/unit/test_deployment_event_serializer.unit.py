"""Tests unitaires de la (de)serialisation JSON d'un DeploymentEvent."""

import json

import pytest

from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.domain.value_objects.deployment_event import DeploymentEvent
from app.deployment.infrastructure.events.deployment_event_serializer import (
    deserialize_deployment_event,
    serialize_deployment_event,
)


class TestSerializeDeploymentEvent:
    def test_serialise_un_event_minimal(self) -> None:
        event = DeploymentEvent(status=DeploymentStatus.PROVISIONING)

        payload = json.loads(serialize_deployment_event(event))

        assert payload == {
            "status": "provisioning",
            "message": None,
            "access_url": None,
            "secret": None,
        }

    def test_serialise_un_event_running_complet(self) -> None:
        event = DeploymentEvent(
            status=DeploymentStatus.RUNNING,
            message="Conteneur demarre",
            access_url="host:54321",
            secret="s3cret-genere",
        )

        payload = json.loads(serialize_deployment_event(event))

        assert payload == {
            "status": "running",
            "message": "Conteneur demarre",
            "access_url": "host:54321",
            "secret": "s3cret-genere",
        }

    def test_produit_une_chaine_json(self) -> None:
        event = DeploymentEvent(status=DeploymentStatus.FAILED, message="boom")

        assert isinstance(serialize_deployment_event(event), str)


class TestDeserializeDeploymentEvent:
    def test_reconstruit_un_event_minimal(self) -> None:
        raw = json.dumps({"status": "stopped"})

        event = deserialize_deployment_event(raw)

        assert event == DeploymentEvent(status=DeploymentStatus.STOPPED)

    def test_reconstruit_un_event_running_complet(self) -> None:
        raw = json.dumps(
            {
                "status": "running",
                "message": "ok",
                "access_url": "host:1234",
                "secret": "pwd",
            }
        )

        event = deserialize_deployment_event(raw)

        assert event == DeploymentEvent(
            status=DeploymentStatus.RUNNING,
            message="ok",
            access_url="host:1234",
            secret="pwd",
        )

    def test_roundtrip_preserve_l_event(self) -> None:
        event = DeploymentEvent(
            status=DeploymentStatus.RUNNING,
            message="m",
            access_url="h:1",
            secret="p",
        )

        assert deserialize_deployment_event(serialize_deployment_event(event)) == event

    def test_status_inconnu_leve_value_error(self) -> None:
        raw = json.dumps({"status": "unknown"})

        with pytest.raises(ValueError):
            deserialize_deployment_event(raw)
