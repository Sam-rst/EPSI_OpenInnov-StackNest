"""Resolution des cles de params `secret` par service, pour le masquage REST.

La reponse de detail masque les valeurs des params declares `secret` par le
template de chaque service (cf. `StackServiceResponse`). Cette resolution
interroge le port de lecture du catalogue une fois par service et memoise par
couple `(template_id, version)` pour ne pas multiplier les acces quand plusieurs
services partagent le meme template. Renvoie une `frozenset` vide pour un
template introuvable (rien a masquer alors).
"""

from collections.abc import Sequence
from uuid import UUID

from app.stack.domain.entities.stack_service import StackService
from app.stack.domain.interfaces.stack_template_reader import StackTemplateReader


class SecretKeysResolver:
    """Construit la map `service_id -> cles de params secret` via le catalogue."""

    def __init__(self, reader: StackTemplateReader) -> None:
        self._reader = reader
        self._cache: dict[tuple[UUID, str], frozenset[str]] = {}

    async def resolve(self, services: Sequence[StackService]) -> dict[UUID, frozenset[str]]:
        """Renvoie, pour chaque service, les cles de ses params `secret`."""
        return {service.id: await self._secret_keys_for(service) for service in services}

    async def _secret_keys_for(self, service: StackService) -> frozenset[str]:
        key = (service.template_id, service.version)
        if key not in self._cache:
            ref = await self._reader.get(service.template_id, service.version)
            self._cache[key] = ref.secret_param_keys if ref is not None else frozenset()
        return self._cache[key]
