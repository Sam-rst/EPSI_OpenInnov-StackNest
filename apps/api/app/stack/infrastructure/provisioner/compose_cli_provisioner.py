"""Implementation CLI `docker compose` du port `StackProvisioner` du domaine.

Materialise un `ComposeFile` en projet `docker compose` reel via la CLI (le
plugin compose est installe dans l'image worker, qui monte `/var/run/docker.
sock`). Le compose-file est transmis au plugin par **stdin** (`-f -`) : il ne
touche jamais le disque, ce qui evite de persister les secrets generes
worker-side qu'il contient (cf. spec section « Securite »).

Sequence `up` :
1. `docker compose -p {project} -f - up -d` (compose-file via stdin) ;
2. `docker compose -p {project} ps --format json` (NDJSON) pour relire les ports
   hote ephemeres publies par Docket et la reference de chaque conteneur.

`down` : `docker compose -p {project} down -v` (conteneurs + volumes). Le projet
etant trace par les labels Docker, `ps`/`down` n'ont pas besoin du compose-file.

Toute sortie non nulle est convertie en `ComposeException` (policy try/except
sur l'infra uniquement). Le contenu du compose-file n'est jamais loggue.
"""

import json
from urllib.parse import urlparse

import structlog

from app.stack.domain.interfaces.stack_provisioner import StackProvisioner
from app.stack.domain.value_objects.compose_file import ComposeFile
from app.stack.domain.value_objects.service_provision_result import ServiceProvisionResult
from app.stack.infrastructure.provisioner.command_result import CommandResult
from app.stack.infrastructure.provisioner.command_runner import CommandRunner, run_subprocess
from app.stack.infrastructure.provisioner.compose_exception import ComposeException

_logger = structlog.get_logger(__name__)

_LOCAL_HOST = "localhost"
_COMPOSE_BASE = ["docker", "compose"]
_RUNNING_STATE = "running"


class ComposeCliProvisioner(StackProvisioner):
    """Adaptateur CLI `docker compose` implementant le contrat `StackProvisioner`.

    Le `host` (nom d'hote lisible reporte dans les `ServiceProvisionResult`) et le
    runner de sous-process sont injectes, ce qui rend l'adaptateur testable sans
    demon Docker (runner fake). En production, utiliser la fabrique
    `from_docker_host(settings.docker_host)`.
    """

    def __init__(self, *, host: str, runner: CommandRunner = run_subprocess) -> None:
        self._host = host
        self._runner = runner

    @classmethod
    def from_docker_host(cls, docker_host: str) -> "ComposeCliProvisioner":
        """Construit le provisioner depuis le champ de config `docker_host`.

        - vide -> demon local, host = `localhost` ;
        - URL (`ssh://`, `tcp://`, ...) -> host extrait de l'URL. (La CLI compose
          honore la variable d'environnement `DOCKER_HOST` du process worker.)
        """
        target = docker_host.strip()
        if not target:
            return cls(host=_LOCAL_HOST)
        return cls(host=_extract_host(target))

    async def up(self, compose_file: ComposeFile) -> list[ServiceProvisionResult]:
        await self._compose_up(compose_file)
        return await self._read_services(compose_file.project_name)

    async def down(self, project_name: str) -> None:
        result = await self._runner([*_COMPOSE_BASE, "-p", project_name, "down", "-v"])
        self._require_success(result, f"compose down du projet {project_name}")
        _logger.info("stack.compose.down", project=project_name)

    async def _compose_up(self, compose_file: ComposeFile) -> None:
        """Lance `compose up -d` en passant le compose-file par stdin (`-f -`)."""
        result = await self._runner(
            [*_COMPOSE_BASE, "-p", compose_file.project_name, "-f", "-", "up", "-d"],
            stdin=compose_file.content,
        )
        # On ne logge JAMAIS compose_file.content (secrets). Seul le projet est sur.
        self._require_success(result, f"compose up du projet {compose_file.project_name}")
        _logger.info("stack.compose.up", project=compose_file.project_name)

    async def _read_services(self, project_name: str) -> list[ServiceProvisionResult]:
        """Relit l'etat des conteneurs (`compose ps --format json`) par service."""
        result = await self._runner([*_COMPOSE_BASE, "-p", project_name, "ps", "--format", "json"])
        self._require_success(result, f"compose ps du projet {project_name}")
        return [self._to_result(entry) for entry in self._parse_ndjson(result.stdout)]

    def _to_result(self, entry: dict[str, object]) -> ServiceProvisionResult:
        """Projette une ligne `compose ps` en `ServiceProvisionResult`."""
        alias = str(entry.get("Service", ""))
        container_ref = str(entry.get("Name") or entry.get("ID") or "")
        return ServiceProvisionResult(
            alias=alias,
            host=self._host,
            container_ref=container_ref,
            published_port=_first_published_port(entry.get("Publishers")),
        )

    @staticmethod
    def _parse_ndjson(raw: str) -> list[dict[str, object]]:
        """Parse la sortie NDJSON de `compose ps` (un objet JSON par ligne)."""
        entries: list[dict[str, object]] = []
        for line in raw.splitlines():
            stripped = line.strip()
            if not stripped:
                continue
            try:
                entries.append(json.loads(stripped))
            except json.JSONDecodeError as error:  # frontiere infra : sortie illisible
                raise ComposeException(f"Sortie `compose ps` illisible : {error}") from error
        return entries

    @staticmethod
    def _require_success(result: CommandResult, action: str) -> None:
        """Convertit un echec de sous-process en `ComposeException`."""
        if not result.is_success():
            raise ComposeException(
                f"Echec {action} : {result.stderr.strip() or result.stdout.strip()}"
            )


def _first_published_port(publishers: object) -> int | None:
    """Extrait le premier port hote publie d'une liste `Publishers`, sinon None."""
    if not isinstance(publishers, list):
        return None
    for publisher in publishers:
        if isinstance(publisher, dict):
            port = publisher.get("PublishedPort")
            if isinstance(port, int) and port > 0:
                return port
    return None


def _extract_host(docker_host: str) -> str:
    """Extrait le nom d'hote d'une URL `DOCKER_HOST` (`ssh://`, `tcp://`, ...)."""
    netloc = urlparse(docker_host).netloc
    host_part = netloc.rsplit("@", 1)[-1]  # retire d'eventuels credentials
    host = host_part.rsplit(":", 1)[0]  # retire un eventuel port
    return host or _LOCAL_HOST
