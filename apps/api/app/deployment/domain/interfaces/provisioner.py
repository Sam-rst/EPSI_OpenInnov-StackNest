"""Interface (port) du moteur de provisioning d'un conteneur."""

from abc import ABC, abstractmethod

from app.deployment.domain.value_objects.container_spec import ContainerSpec
from app.deployment.domain.value_objects.provision_result import ProvisionResult


class Provisioner(ABC):
    """Contrat du moteur qui materialise un `ContainerSpec` en conteneur reel.

    Abstraction du moteur d'execution (cf. design decision 2) : implemente au MVP
    par un adaptateur Docker SDK (`DockerSdkProvisioner`, via `DOCKER_HOST=ssh://`),
    remplacable ulterieurement par Terraform/Proxmox sans toucher au domaine. Les
    methodes manipulent une `container_ref` opaque (id/nom renvoye par `create`).

    Toutes les operations sont I/O distantes : les implementations encapsulent les
    erreurs reseau/SSH et les traduisent (echec -> statut `failed` cote use case).
    """

    @abstractmethod
    async def create(self, spec: ContainerSpec) -> ProvisionResult:
        """Pull l'image, cree et demarre le conteneur, publie le port; renvoie ses coordonnees."""

    @abstractmethod
    async def start(self, container_ref: str) -> ProvisionResult:
        """Redemarre un conteneur arrete; renvoie ses coordonnees (port republie)."""

    @abstractmethod
    async def stop(self, container_ref: str) -> None:
        """Arrete le conteneur sans le supprimer (conserve volume + donnees)."""

    @abstractmethod
    async def destroy(self, container_ref: str) -> None:
        """Supprime le conteneur (et nettoie les ressources associees)."""

    @abstractmethod
    async def recreate(self, spec: ContainerSpec, container_ref: str) -> ProvisionResult:
        """Detruit puis recree le conteneur avec une nouvelle spec (ex. nouveau secret)."""

    @abstractmethod
    async def logs(self, container_ref: str) -> str:
        """Renvoie les logs courants du conteneur (diffuses en SSE)."""
