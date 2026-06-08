"""Resolveur memoize du descripteur de provisioning (evite le N+1 en liste)."""

from uuid import UUID

from app.deployment.domain.interfaces.template_provisioning_reader import (
    TemplateProvisioningReader,
)
from app.deployment.domain.value_objects.template_provisioning import TemplateProvisioning


class ProvisioningResolver:
    """Resout le descripteur d'un template (template_name + params) avec cache.

    Utilise par le listing des deploiements : plusieurs deploiements partagent
    souvent le meme template/version, on memoize donc la lecture par cle
    `(template_id, version)` pour ne pas interroger le catalogue en boucle. Le
    cache vit le temps d'une requete (instancie par endpoint).
    """

    def __init__(self, reader: TemplateProvisioningReader) -> None:
        self._reader = reader
        self._cache: dict[tuple[UUID, str], TemplateProvisioning | None] = {}

    async def resolve(self, template_id: UUID, version: str) -> TemplateProvisioning | None:
        """Renvoie le descripteur (cache par template/version), ou None si absent."""
        key = (template_id, version)
        if key not in self._cache:
            self._cache[key] = await self._reader.get(template_id, version)
        return self._cache[key]
