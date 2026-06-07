"""Tests unitaires du DockerSdkProvisioner (client docker-py mocke).

Choix unit vs integ : le provisioner est teste integralement en unit avec un
client docker-py mocke (MagicMock). La CI ne garantit pas la presence d'un demon
Docker accessible (et l'hote d'execution reel est SSH, hors CI). On valide donc :

- le mapping `ContainerSpec` -> parametres docker-py (image/tag, env, command,
  port ephemere, limites cpu/mem, labels) ;
- la relecture du port publie -> `ProvisionResult` ;
- les actions de cycle de vie (start/stop/destroy/recreate/logs) ;
- la conversion des erreurs docker-py en `ProvisioningException` (try/except infra) ;
- l'absence de fuite de secret dans les logs.

Un test d'integration contre un Docker local reste possible plus tard (cf. spec
section 9), mais n'est pas requis pour merger cette slice.
"""

from typing import Any
from unittest.mock import MagicMock

import pytest
from structlog.testing import capture_logs

from app.deployment.domain.value_objects.container_spec import ContainerSpec
from app.deployment.domain.value_objects.provision_result import ProvisionResult
from app.deployment.infrastructure.provisioner.docker_sdk_provisioner import (
    DockerSdkProvisioner,
)
from app.deployment.infrastructure.provisioner.provisioning_exception import (
    ProvisioningException,
)


def _make_container(*, container_id: str = "abc123", host_port: str = "32768") -> MagicMock:
    """Construit un faux conteneur docker-py renvoyant un port publie."""
    container = MagicMock()
    container.id = container_id
    container.ports = {"5432/tcp": [{"HostIp": "0.0.0.0", "HostPort": host_port}]}
    container.logs.return_value = b"ligne 1\nligne 2\n"
    return container


def _make_client(container: MagicMock | None = None) -> MagicMock:
    """Construit un faux DockerClient docker-py (images + containers)."""
    client = MagicMock()
    built = container if container is not None else _make_container()
    client.containers.run.return_value = built
    client.containers.get.return_value = built
    return client


def _spec(**overrides: Any) -> ContainerSpec:
    base: dict[str, Any] = {
        "image": "postgres:16",
        "env": {"POSTGRES_PASSWORD": "s3cr3t"},
        "internal_port": 5432,
        "cpu_limit": 1.5,
        "mem_limit": "512m",
        "labels": {"stacknest.deployment_id": "dep-1"},
    }
    base.update(overrides)
    return ContainerSpec(**base)


class TestDockerSdkProvisionerCreate:
    async def test_pull_image_taguee_puis_run_detache(self) -> None:
        client = _make_client()
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        await provisioner.create(_spec())

        client.images.pull.assert_called_once_with("postgres", tag="16")
        client.containers.run.assert_called_once()
        _, kwargs = client.containers.run.call_args
        assert kwargs["image"] == "postgres:16"
        assert kwargs["detach"] is True

    async def test_publie_le_port_interne_en_port_ephemere(self) -> None:
        client = _make_client()
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        await provisioner.create(_spec(internal_port=5432))

        _, kwargs = client.containers.run.call_args
        assert kwargs["ports"] == {"5432/tcp": None}

    async def test_sans_port_interne_aucune_publication(self) -> None:
        client = _make_client(_make_container())
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        # Sans port a publier on ne peut pas construire un ProvisionResult valide
        # (port obligatoire) -> on attend une ProvisioningException explicite.
        with pytest.raises(ProvisioningException):
            await provisioner.create(_spec(internal_port=None))

        _, kwargs = client.containers.run.call_args
        assert kwargs["ports"] == {}

    async def test_mappe_env_command_labels_et_limites(self) -> None:
        client = _make_client()
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        await provisioner.create(
            _spec(
                env={"POSTGRES_PASSWORD": "p"},
                command=["postgres", "-c", "max_connections=50"],
                cpu_limit=2.0,
                mem_limit="1g",
                labels={"stacknest.deployment_id": "dep-42"},
            )
        )

        _, kwargs = client.containers.run.call_args
        assert kwargs["environment"] == {"POSTGRES_PASSWORD": "p"}
        assert kwargs["command"] == ["postgres", "-c", "max_connections=50"]
        assert kwargs["labels"] == {"stacknest.deployment_id": "dep-42"}
        assert kwargs["nano_cpus"] == 2_000_000_000
        assert kwargs["mem_limit"] == "1g"

    async def test_command_none_non_transmise(self) -> None:
        client = _make_client()
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        await provisioner.create(_spec(command=None))

        _, kwargs = client.containers.run.call_args
        assert kwargs.get("command") is None

    async def test_relit_le_port_publie_et_renvoie_provision_result(self) -> None:
        container = _make_container(container_id="cid-9", host_port="49160")
        client = _make_client(container)
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        result = await provisioner.create(_spec(internal_port=5432))

        container.reload.assert_called_once()
        assert isinstance(result, ProvisionResult)
        assert result.host == "execB"
        assert result.port == 49160
        assert result.container_ref == "cid-9"

    async def test_erreur_docker_convertie_en_provisioning_exception(self) -> None:
        from docker.errors import APIError

        client = _make_client()
        client.containers.run.side_effect = APIError("daemon unreachable")
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        with pytest.raises(ProvisioningException) as exc_info:
            await provisioner.create(_spec())

        assert exc_info.value.code == "PROVISIONING_FAILED"
        assert exc_info.value.http_status == 502
        assert isinstance(exc_info.value.__cause__, APIError)

    async def test_port_publie_absent_leve_provisioning_exception(self) -> None:
        container = _make_container()
        container.ports = {}  # docker n'a pas (encore) publie le port
        client = _make_client(container)
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        with pytest.raises(ProvisioningException):
            await provisioner.create(_spec(internal_port=5432))

    async def test_id_conteneur_absent_leve_provisioning_exception(self) -> None:
        container = _make_container()
        container.id = None  # docker-py n'a pas renvoye d'identifiant
        client = _make_client(container)
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        with pytest.raises(ProvisioningException):
            await provisioner.create(_spec(internal_port=5432))


class TestDockerSdkProvisionerLogging:
    async def test_ne_logge_jamais_le_secret(self) -> None:
        client = _make_client()
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        with capture_logs() as logs:
            await provisioner.create(_spec(env={"POSTGRES_PASSWORD": "TOP_SECRET_VALUE"}))

        assert "TOP_SECRET_VALUE" not in str(logs)


class TestDockerSdkProvisionerStart:
    async def test_start_redemarre_et_renvoie_le_nouveau_port(self) -> None:
        container = _make_container(container_id="cid-1", host_port="50000")
        client = _make_client(container)
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        result = await provisioner.start("cid-1")

        client.containers.get.assert_called_once_with("cid-1")
        container.start.assert_called_once()
        container.reload.assert_called_once()
        assert result.host == "execB"
        assert result.port == 50000
        assert result.container_ref == "cid-1"

    async def test_start_erreur_convertie(self) -> None:
        from docker.errors import NotFound

        client = _make_client()
        client.containers.get.side_effect = NotFound("no such container")
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        with pytest.raises(ProvisioningException):
            await provisioner.start("absent")

    async def test_start_sans_port_publie_leve_provisioning_exception(self) -> None:
        container = _make_container()
        container.ports = {}  # conteneur redemarre mais aucun port publie
        client = _make_client(container)
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        with pytest.raises(ProvisioningException):
            await provisioner.start("cid-1")

    async def test_start_ignore_un_binding_sans_host_port(self) -> None:
        container = _make_container()
        # Premier binding sans HostPort (port expose mais non publie),
        # second binding correctement publie -> on doit lire le second.
        container.ports = {
            "8080/tcp": [{"HostIp": "0.0.0.0"}],
            "5432/tcp": [{"HostIp": "0.0.0.0", "HostPort": "51000"}],
        }
        client = _make_client(container)
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        result = await provisioner.start("cid-1")

        assert result.port == 51000


class TestDockerSdkProvisionerStop:
    async def test_stop_arrete_sans_supprimer(self) -> None:
        container = _make_container()
        client = _make_client(container)
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        await provisioner.stop("cid-1")

        client.containers.get.assert_called_once_with("cid-1")
        container.stop.assert_called_once()
        container.remove.assert_not_called()

    async def test_stop_erreur_convertie(self) -> None:
        from docker.errors import APIError

        client = _make_client()
        client.containers.get.side_effect = APIError("boom")
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        with pytest.raises(ProvisioningException):
            await provisioner.stop("cid-1")


class TestDockerSdkProvisionerDestroy:
    async def test_destroy_supprime_avec_force(self) -> None:
        container = _make_container()
        client = _make_client(container)
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        await provisioner.destroy("cid-1")

        client.containers.get.assert_called_once_with("cid-1")
        container.remove.assert_called_once_with(force=True)

    async def test_destroy_erreur_convertie(self) -> None:
        from docker.errors import APIError

        client = _make_client()
        client.containers.get.side_effect = APIError("boom")
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        with pytest.raises(ProvisioningException):
            await provisioner.destroy("cid-1")


class TestDockerSdkProvisionerRecreate:
    async def test_recreate_stop_remove_puis_recree(self) -> None:
        ancien = _make_container(container_id="old", host_port="40000")
        nouveau = _make_container(container_id="new", host_port="41000")
        client = MagicMock()
        client.containers.get.return_value = ancien
        client.containers.run.return_value = nouveau
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        result = await provisioner.recreate(_spec(internal_port=5432), "old")

        client.containers.get.assert_called_once_with("old")
        ancien.stop.assert_called_once()
        ancien.remove.assert_called_once_with(force=True)
        client.images.pull.assert_called_once()
        client.containers.run.assert_called_once()
        assert result.container_ref == "new"
        assert result.port == 41000

    async def test_recreate_erreur_convertie(self) -> None:
        from docker.errors import APIError

        client = _make_client()
        client.containers.get.side_effect = APIError("boom")
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        with pytest.raises(ProvisioningException):
            await provisioner.recreate(_spec(), "old")


class TestDockerSdkProvisionerLogs:
    async def test_logs_renvoie_le_texte_decode(self) -> None:
        container = _make_container()
        container.logs.return_value = b"hello\nworld\n"
        client = _make_client(container)
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        out = await provisioner.logs("cid-1")

        client.containers.get.assert_called_once_with("cid-1")
        assert out == "hello\nworld\n"

    async def test_logs_accepte_un_str(self) -> None:
        container = _make_container()
        container.logs.return_value = "deja du texte"
        client = _make_client(container)
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        out = await provisioner.logs("cid-1")

        assert out == "deja du texte"

    async def test_logs_erreur_convertie(self) -> None:
        from docker.errors import NotFound

        client = _make_client()
        client.containers.get.side_effect = NotFound("no such container")
        provisioner = DockerSdkProvisioner(client=client, host="execB")

        with pytest.raises(ProvisioningException):
            await provisioner.logs("absent")
