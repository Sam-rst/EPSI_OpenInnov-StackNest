"""Use case ListTemplates : liste legere de tous les templates du catalogue."""

from app.catalog.domain.entities.template import Template
from app.catalog.domain.interfaces.template_repository import TemplateRepository


class ListTemplates:
    """Renvoie l'ensemble des templates pour la vue catalogue (cartes legeres).

    Le filtrage est assume cote client (cf. design) : on renvoie tout. Les
    templates sont alleges (sans versions ni params) par le repository.
    """

    def __init__(self, repository: TemplateRepository) -> None:
        self._repository = repository

    async def execute(self) -> list[Template]:
        return await self._repository.list_all()
