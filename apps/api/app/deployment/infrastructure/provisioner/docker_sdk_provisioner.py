"""Implementation Docker SDK (docker-py) du port `Provisioner` du domaine.

Materialise un `ContainerSpec` en conteneur Docker reel sur un hote d'execution
distant cible par `DOCKER_HOST` (au MVP : `ssh://deployer@B`). Le plan de
controle ne fait tourner aucun workload : c'est le worker qui appelle ce
provisioner (cf. spec section 3).

docker-py est synchrone : chaque appel reseau est deporte dans un thread via
`asyncio.to_thread` pour ne pas bloquer la boucle d'evenements (worker async).
Toute erreur d'infrastructure est convertie en `ProvisioningException` (policy
try/except sur l'infra uniquement). Aucun secret (`spec.env`) n'est jamais
loggue : seuls l'image, les labels et le port publie le sont.
"""

import asyncio
import time
from typing import Any
from urllib.parse import urlparse

import docker
import structlog
from docker.models.containers import Container

from app.deployment.domain.interfaces.provisioner import Provisioner
from app.deployment.domain.value_objects.container_spec import ContainerSpec
from app.deployment.domain.value_objects.provision_result import ProvisionResult
from app.deployment.infrastructure.provisioner.provisioning_exception import (
    ProvisioningException,
)

_logger = structlog.get_logger(__name__)

_LOCAL_HOST = "localhost"
_NANO_CPUS_PER_CORE = 1_000_000_000
_PROTOCOL = "tcp"
# Apres `run(detach=True)`, Docker peuple le mapping de port de maniere
# asynchrone : `container.ports` est souvent vide juste apres le run. On poll
# `reload()` jusqu'a ce que le port hote ephemere soit assigne (race docker-py).
_PORT_POLL_ATTEMPTS = 40
_PORT_POLL_DELAY_SECONDS = 0.25


class DockerSdkProvisioner(Provisioner):
    """Adaptateur docker-py implementant le contrat `Provisioner`.

    Le client docker-py et le `host` (nom d'hote lisible reporte dans le
    `ProvisionResult`) sont injectes au constructeur, ce qui rend l'adaptateur
    testable sans demon Docker. En production, utiliser la fabrique
    `from_docker_host(settings.docker_host)`.

    Securite (cf. spec section 8) : seule l'image figee du `ContainerSpec`
    (derivee du catalogue, `repo:version`) est lancee — jamais une image
    arbitraire. Les limites cpu/mem plafonnent chaque conteneur (anti-abus).
    """

    def __init__(self, *, client: docker.DockerClient, host: str) -> None:
        self._client = client
        self._host = host

    @property
    def host(self) -> str:
        """Hote d'execution reporte dans le `ProvisionResult`."""
        return self._host

    @classmethod
    def from_docker_host(cls, docker_host: str) -> "DockerSdkProvisioner":
        """Construit le provisioner depuis le champ de config `docker_host`.

        - vide -> demon local (`docker.from_env`), host = `localhost` ;
        - URL (`ssh://`, `tcp://`, ...) -> `DockerClient(base_url=...)`, host
          extrait de l'URL.
        """
        target = docker_host.strip()
        if not target:
            return cls(client=docker.from_env(), host=_LOCAL_HOST)
        client = docker.DockerClient(base_url=target)
        return cls(client=client, host=_extract_host(target))

    async def create(self, spec: ContainerSpec) -> ProvisionResult:
        return await self._run_container(spec)

    async def start(self, container_ref: str) -> ProvisionResult:
        try:
            container = await asyncio.to_thread(self._client.containers.get, container_ref)
            await asyncio.to_thread(container.start)
            await asyncio.to_thread(container.reload)
            port = _read_first_published_port(container.ports)
        except ProvisioningException:
            raise
        except Exception as err:  # frontiere infra docker-py : on traduit toute erreur
            raise ProvisioningException(f"Echec du demarrage de {container_ref}: {err}") from err

        _logger.info("deployment.container.started", container_ref=container_ref, port=port)
        return ProvisionResult(host=self._host, port=port, container_ref=container_ref)

    async def stop(self, container_ref: str) -> None:
        try:
            container = await asyncio.to_thread(self._client.containers.get, container_ref)
            await asyncio.to_thread(container.stop)
        except Exception as err:  # frontiere infra docker-py : on traduit toute erreur
            raise ProvisioningException(f"Echec de l'arret de {container_ref}: {err}") from err

        _logger.info("deployment.container.stopped", container_ref=container_ref)

    async def destroy(self, container_ref: str) -> None:
        try:
            container = await asyncio.to_thread(self._client.containers.get, container_ref)
            await asyncio.to_thread(container.remove, force=True)
        except Exception as err:  # frontiere infra docker-py : on traduit toute erreur
            raise ProvisioningException(
                f"Echec de la suppression de {container_ref}: {err}"
            ) from err

        _logger.info("deployment.container.destroyed", container_ref=container_ref)

    async def recreate(self, spec: ContainerSpec, container_ref: str) -> ProvisionResult:
        try:
            container = await asyncio.to_thread(self._client.containers.get, container_ref)
            await asyncio.to_thread(container.stop)
            await asyncio.to_thread(container.remove, force=True)
        except Exception as err:  # frontiere infra docker-py : on traduit toute erreur
            raise ProvisioningException(
                f"Echec de la recreation de {container_ref}: {err}"
            ) from err
        return await self._run_container(spec)

    async def logs(self, container_ref: str) -> str:
        try:
            container = await asyncio.to_thread(self._client.containers.get, container_ref)
            raw = await asyncio.to_thread(container.logs)
        except Exception as err:  # frontiere infra docker-py : on traduit toute erreur
            raise ProvisioningException(
                f"Echec de la lecture des logs de {container_ref}: {err}"
            ) from err

        return raw.decode("utf-8", errors="replace") if isinstance(raw, bytes) else str(raw)

    async def _run_container(self, spec: ContainerSpec) -> ProvisionResult:
        run_kwargs = _build_run_kwargs(spec)
        try:
            await asyncio.to_thread(self._pull_image, spec.image)
            container = await asyncio.to_thread(self._run_detached, run_kwargs)
            container_ref = _require_container_id(container.id)
            port = await asyncio.to_thread(_await_published_port, container, spec.internal_port)
        except ProvisioningException:
            raise
        except Exception as err:  # frontiere infra docker-py : on traduit toute erreur
            raise ProvisioningException(f"Echec du provisioning de {spec.image}: {err}") from err

        # On ne logge JAMAIS spec.env (secret). Seuls image/labels/port sont surs.
        _logger.info(
            "deployment.container.created",
            image=spec.image,
            container_ref=container_ref,
            host=self._host,
            port=port,
            labels=spec.labels,
        )
        return ProvisionResult(host=self._host, port=port, container_ref=container_ref)

    def _run_detached(self, run_kwargs: dict[str, Any]) -> Container:
        """Lance le conteneur en mode detache (`detach=True` -> renvoie un Container).

        `detach=True` est passe explicitement (hors `run_kwargs`) pour que mypy
        resolve l'overload de `containers.run` vers le retour `Container` plutot
        que vers les logs `bytes` du mode synchrone.
        """
        return self._client.containers.run(detach=True, **run_kwargs)

    def _pull_image(self, image: str) -> None:
        repository, _, tag = image.partition(":")
        self._client.images.pull(repository, tag=tag)


def _build_run_kwargs(spec: ContainerSpec) -> dict[str, Any]:
    """Traduit un `ContainerSpec` en parametres `containers.run` de docker-py.

    Port ephemere : on demande a Docker de publier le port interne sur un port
    libre de l'hote (`{"<port>/tcp": None}`) puis on relit le port assigne
    (cf. spec, mitigation collision de ports).
    """
    ports: dict[str, None] = {}
    if spec.internal_port is not None:
        ports[f"{spec.internal_port}/{_PROTOCOL}"] = None

    run_kwargs: dict[str, Any] = {
        "image": spec.image,
        "environment": dict(spec.env),
        "ports": ports,
        "labels": dict(spec.labels),
        "nano_cpus": int(spec.cpu_limit * _NANO_CPUS_PER_CORE),
        "mem_limit": spec.mem_limit,
    }
    if spec.command is not None:
        run_kwargs["command"] = list(spec.command)
    return run_kwargs


def _read_published_port(ports: dict[str, Any] | None, internal_port: int | None) -> int:
    """Lit le port hote publie pour le `internal_port` demande (create/recreate).

    Format docker-py : `{"5432/tcp": [{"HostIp": "0.0.0.0", "HostPort": "32768"}]}`.
    Un `ProvisionResult` exige un port : sans `internal_port` a publier, ou si le
    binding attendu est absent, on leve `ProvisioningException`.
    """
    if internal_port is None:
        raise ProvisioningException("ContainerSpec sans port interne : rien a publier.")
    host_port = _host_port_of((ports or {}).get(f"{internal_port}/{_PROTOCOL}"))
    return _require_port(host_port)


def _await_published_port(container: Container, internal_port: int | None) -> int:
    """Relit l'etat du conteneur jusqu'a ce que Docker ait publie le port hote.

    Apres `containers.run(detach=True)`, `container.ports` est souvent vide : le
    binding de port apparait de maniere asynchrone. On poll `reload()` jusqu'a
    `_PORT_POLL_ATTEMPTS`, sinon on leve `ProvisioningException` (timeout).
    """
    if internal_port is None:
        raise ProvisioningException("ContainerSpec sans port interne : rien a publier.")
    key = f"{internal_port}/{_PROTOCOL}"
    for _ in range(_PORT_POLL_ATTEMPTS):
        container.reload()
        host_port = _host_port_of((container.ports or {}).get(key))
        if host_port is not None:
            return host_port
        time.sleep(_PORT_POLL_DELAY_SECONDS)
    raise ProvisioningException("Aucun port publie par Docker pour ce conteneur (timeout).")


def _read_first_published_port(ports: dict[str, Any] | None) -> int:
    """Lit le premier port hote publie (start : la spec d'origine est inconnue)."""
    for bindings in (ports or {}).values():
        host_port = _host_port_of(bindings)
        if host_port is not None:
            return host_port
    raise ProvisioningException("Aucun port publie par Docker pour ce conteneur.")


def _host_port_of(bindings: list[dict[str, Any]] | None) -> int | None:
    """Extrait le port hote d'un binding docker-py, ou None s'il n'est pas publie."""
    if bindings and bindings[0].get("HostPort"):
        return int(bindings[0]["HostPort"])
    return None


def _require_port(host_port: int | None) -> int:
    """Garantit la presence d'un port publie, sinon leve `ProvisioningException`."""
    if host_port is None:
        raise ProvisioningException("Aucun port publie par Docker pour ce conteneur.")
    return host_port


def _require_container_id(container_id: str | None) -> str:
    """Garantit que docker-py a renvoye un id de conteneur, sinon leve."""
    if not container_id:
        raise ProvisioningException("Docker n'a pas renvoye d'identifiant de conteneur.")
    return container_id


def _extract_host(docker_host: str) -> str:
    """Extrait le nom d'hote d'une URL `DOCKER_HOST` (`ssh://`, `tcp://`, ...).

    On lit le `netloc` brut (sans passer par `urlparse().hostname`, qui force la
    casse en minuscules) afin de preserver la casse du host configure : il sert
    de libelle dans le `ProvisionResult`/`AccessEndpoint` affiche a l'utilisateur.
    """
    netloc = urlparse(docker_host).netloc
    host_part = netloc.rsplit("@", 1)[-1]  # retire d'eventuels credentials
    host = host_part.rsplit(":", 1)[0]  # retire un eventuel port
    return host or _LOCAL_HOST
