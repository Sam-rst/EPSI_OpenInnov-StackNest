"""Tests unitaires du port StackActions (delegation de la composition de stack).

Parallele a `DeploymentActions` : a la confirmation d'une proposition
`compose_stack`, le chat delegue a ce port la creation reelle de la stack (use
case `CreateStack` + enfilage du provisioning). On verifie que le contrat impose
sa methode et qu'une implementation minimale en memoire l'honore en renvoyant
l'identifiant de la stack creee (jamais de secret).
"""

from uuid import uuid4

import pytest

from app.chat.domain.interfaces.stack_actions import StackActions
from app.chat.domain.value_objects.stack_composition_spec import (
    StackLinkSpec,
    StackServiceSpec,
)


class _InMemoryStackActions(StackActions):
    """Implementation minimale : enregistre l'appel et renvoie un id de stack."""

    def __init__(self, stack_id: str) -> None:
        self._stack_id = stack_id
        self.calls: list[dict[str, object]] = []

    async def compose(
        self,
        *,
        owner_id: object,
        name: str,
        services: tuple[StackServiceSpec, ...],
        links: tuple[StackLinkSpec, ...],
    ) -> str:
        self.calls.append(
            {"owner_id": owner_id, "name": name, "services": services, "links": links}
        )
        return self._stack_id


class TestStackActionsContract:
    def test_le_port_est_abstrait(self) -> None:
        with pytest.raises(TypeError):
            StackActions()  # type: ignore[abstract]

    async def test_compose_renvoie_l_id_de_la_stack_creee(self) -> None:
        stack_id = str(uuid4())
        actions = _InMemoryStackActions(stack_id)
        owner = uuid4()
        services = (StackServiceSpec(template_id=uuid4(), alias="db", version="16"),)

        result = await actions.compose(owner_id=owner, name="ma-stack", services=services, links=())

        assert result == stack_id
        assert actions.calls[0]["name"] == "ma-stack"
        assert actions.calls[0]["services"] == services
