"""Tests unitaires du ComposeCliProvisioner (CLI docker compose, runner injecte).

Le runner de sous-process est injecte (fake) : on teste le parsing du
`docker compose ps --format json` (NDJSON) en `ServiceProvisionResult`, et la
construction des commandes `up`/`down`, sans demon Docker.
"""

import json
from collections.abc import Mapping

import pytest

from app.stack.domain.value_objects.compose_file import ComposeFile
from app.stack.infrastructure.provisioner.command_result import CommandResult
from app.stack.infrastructure.provisioner.compose_cli_provisioner import ComposeCliProvisioner
from app.stack.infrastructure.provisioner.compose_exception import ComposeException

_DB_LINE = {
    "Service": "db",
    "Name": "stack_x-db-1",
    "State": "running",
    "Publishers": [
        {"URL": "0.0.0.0", "TargetPort": 5432, "PublishedPort": 53647, "Protocol": "tcp"}
    ],
}
_API_LINE = {
    "Service": "api",
    "Name": "stack_x-api-1",
    "State": "running",
    "Publishers": [
        {"URL": "0.0.0.0", "TargetPort": 8080, "PublishedPort": 53648, "Protocol": "tcp"}
    ],
}


class _RecordingRunner:
    """Runner de sous-process en memoire : enregistre les commandes, renvoie des resultats scriptes."""

    def __init__(self, results: list[CommandResult]) -> None:
        self._results = list(results)
        self.commands: list[list[str]] = []

    async def __call__(self, args: list[str], *, stdin: str | None = None) -> CommandResult:
        self.commands.append(args)
        return self._results.pop(0)


def _ndjson(*lines: Mapping[str, object]) -> str:
    return "\n".join(json.dumps(line) for line in lines)


def _compose() -> ComposeFile:
    return ComposeFile(project_name="stack_x", content="services: {}\n")


class TestUp:
    async def test_lance_up_puis_parse_les_ports_publies(self) -> None:
        runner = _RecordingRunner(
            [
                CommandResult(returncode=0, stdout="", stderr=""),  # up
                CommandResult(returncode=0, stdout=_ndjson(_DB_LINE, _API_LINE), stderr=""),  # ps
            ]
        )
        provisioner = ComposeCliProvisioner(host="localhost", runner=runner)

        results = await provisioner.up(_compose())

        by_alias = {r.alias: r for r in results}
        assert by_alias["db"].published_port == 53647
        assert by_alias["db"].container_ref == "stack_x-db-1"
        assert by_alias["db"].host == "localhost"
        assert by_alias["api"].published_port == 53648
        # La commande up cible bien le projet et le mode detache.
        up_cmd = runner.commands[0]
        assert "compose" in up_cmd and "-p" in up_cmd and "stack_x" in up_cmd
        assert "up" in up_cmd and "-d" in up_cmd

    async def test_service_sans_publisher_a_un_port_none(self) -> None:
        no_port = {
            "Service": "worker",
            "Name": "stack_x-worker-1",
            "State": "running",
            "Publishers": [],
        }
        runner = _RecordingRunner(
            [
                CommandResult(returncode=0, stdout="", stderr=""),
                CommandResult(returncode=0, stdout=_ndjson(no_port), stderr=""),
            ]
        )
        provisioner = ComposeCliProvisioner(host="localhost", runner=runner)

        results = await provisioner.up(_compose())

        assert results[0].published_port is None

    async def test_echec_du_up_leve_compose_exception(self) -> None:
        runner = _RecordingRunner([CommandResult(returncode=1, stdout="", stderr="boom")])
        provisioner = ComposeCliProvisioner(host="localhost", runner=runner)

        with pytest.raises(ComposeException, match="boom"):
            await provisioner.up(_compose())


class TestDown:
    async def test_down_appelle_compose_down_avec_volumes(self) -> None:
        runner = _RecordingRunner([CommandResult(returncode=0, stdout="", stderr="")])
        provisioner = ComposeCliProvisioner(host="localhost", runner=runner)

        await provisioner.down("stack_x")

        down_cmd = runner.commands[0]
        assert "down" in down_cmd and "-v" in down_cmd
        assert "-p" in down_cmd and "stack_x" in down_cmd

    async def test_echec_du_down_leve_compose_exception(self) -> None:
        runner = _RecordingRunner([CommandResult(returncode=1, stdout="", stderr="kaboom")])
        provisioner = ComposeCliProvisioner(host="localhost", runner=runner)

        with pytest.raises(ComposeException, match="kaboom"):
            await provisioner.down("stack_x")
