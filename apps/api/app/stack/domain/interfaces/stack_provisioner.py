"""Interface (port) du moteur de provisioning d'une stack via docker compose."""

from abc import ABC, abstractmethod

from app.stack.domain.value_objects.compose_file import ComposeFile
from app.stack.domain.value_objects.service_provision_result import ServiceProvisionResult


class StackProvisioner(ABC):
    """Contrat du moteur qui materialise un `ComposeFile` en projet compose reel.

    Abstraction du moteur d'execution (cf. spec « Provisioning ») : implemente au
    MVP par un adaptateur CLI `docker compose` (`ComposeCliProvisioner`), qui ecrit
    le compose-file sur disque et lance `docker compose -p stack_{id} up -d`. Le
    domaine ignore tout de la CLI.

    Toutes les operations sont I/O (sous-process + demon Docker via socket) : les
    implementations encapsulent les erreurs et les traduisent (echec -> statut
    `failed` cote handler de job).
    """

    @abstractmethod
    async def up(self, compose_file: ComposeFile) -> list[ServiceProvisionResult]:
        """Lance `docker compose up -d` et renvoie les coordonnees par service.

        Renvoie un `ServiceProvisionResult` par service du projet (alias, host,
        port publie, reference de conteneur), apres que Docker a assigne les ports
        hote ephemeres.
        """

    @abstractmethod
    async def down(self, project_name: str) -> None:
        """Detruit le projet (`docker compose down -v` : conteneurs + volumes)."""
