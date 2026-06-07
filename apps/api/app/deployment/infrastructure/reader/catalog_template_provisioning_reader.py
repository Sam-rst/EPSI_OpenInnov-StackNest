"""Adaptateur du port TemplateProvisioningReader adosse au repository catalogue."""

from uuid import UUID

from app.catalog.domain.entities.template import Template
from app.catalog.domain.interfaces.template_repository import TemplateRepository
from app.deployment.domain.interfaces.template_provisioning_reader import (
    TemplateProvisioningReader,
)
from app.deployment.domain.value_objects.template_provisioning import TemplateProvisioning


class CatalogTemplateProvisioningReader(TemplateProvisioningReader):
    """Lit le descripteur de provisioning d'un template via le repository catalogue.

    Implemente le port du domaine deploiement en deleguant au `TemplateRepository`
    du catalogue : le slice deploiement reste decouple du catalogue (il ne connait
    que son port). Renvoie `None` si le template est introuvable ou si la version
    demandee n'existe pas, ce que le use case traduit en 404.
    """

    def __init__(self, repository: TemplateRepository) -> None:
        self._repository = repository

    async def get(self, template_id: UUID, version: str) -> TemplateProvisioning | None:
        template = await self._repository.get_by_id(template_id)
        if template is None or not self._has_version(template, version):
            return None
        return TemplateProvisioning(
            image_repository=template.image_repository,
            internal_port=template.internal_port,
            secret_env=template.secret_env,
            engine=template.engine,
        )

    @staticmethod
    def _has_version(template: Template, version: str) -> bool:
        """Vrai si le template propose la version demandee."""
        return any(candidate.version == version for candidate in template.versions)
