"""Adaptateur du port StackTemplateReader adosse au repository catalogue."""

from uuid import UUID

from app.catalog.domain.entities.template import Template
from app.catalog.domain.enums.param_type import ParamType
from app.catalog.domain.interfaces.template_repository import TemplateRepository
from app.stack.domain.interfaces.stack_template_reader import StackTemplateReader
from app.stack.domain.value_objects.stack_template_ref import StackTemplateRef


class CatalogStackTemplateReader(StackTemplateReader):
    """Lit la reference d'un template via le repository catalogue.

    Implemente le port du domaine stack en deleguant au `TemplateRepository` du
    catalogue : le slice stack reste decouple du catalogue (il ne connait que son
    port) — meme pattern que le `CatalogTemplateProvisioningReader` du deploiement.
    Projette le moteur (gate d'ajout a une stack) et les cles des params `secret`
    (masquage dans la reponse REST). Renvoie `None` si le template est introuvable
    ou si la version demandee n'existe pas (422 cote use case).
    """

    def __init__(self, repository: TemplateRepository) -> None:
        self._repository = repository

    async def get(self, template_id: UUID, version: str) -> StackTemplateRef | None:
        template = await self._repository.get_by_id(template_id)
        if template is None or not self._has_version(template, version):
            return None
        return StackTemplateRef(
            template_name=template.name,
            engine=template.engine,
            secret_param_keys=frozenset(
                param.key for param in template.params if param.type is ParamType.SECRET
            ),
        )

    @staticmethod
    def _has_version(template: Template, version: str) -> bool:
        """Vrai si le template propose la version demandee."""
        return any(candidate.version == version for candidate in template.versions)
