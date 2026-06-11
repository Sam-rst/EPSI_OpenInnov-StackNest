"""Agregation du statut global d'une stack a partir des statuts de ses services.

Regle (cf. spec « Statut ») : la stack est `running` si **tous** ses services
sont demarres, `failed` si **au moins un** a echoue, `partial` sinon (certains
seulement up, ou encore en cours). Pure (sans I/O) : testable et reutilisee par
le handler de job apres chaque `compose up`.
"""

from collections.abc import Sequence

from app.stack.domain.enums.service_status import ServiceStatus
from app.stack.domain.enums.stack_status import StackStatus


def aggregate_stack_status(service_statuses: Sequence[ServiceStatus]) -> StackStatus:
    """Agrege les statuts des services en statut global de la stack.

    Leve `ValueError` si la liste est vide (une stack a toujours >= 1 service).
    """
    if not service_statuses:
        raise ValueError(
            "Impossible d'agreger le statut : la stack doit avoir au moins un service."
        )
    if any(status is ServiceStatus.FAILED for status in service_statuses):
        return StackStatus.FAILED
    if all(status is ServiceStatus.RUNNING for status in service_statuses):
        return StackStatus.RUNNING
    return StackStatus.PARTIAL
