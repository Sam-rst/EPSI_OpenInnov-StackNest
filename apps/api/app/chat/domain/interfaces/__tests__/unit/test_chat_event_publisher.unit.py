"""Tests unitaires du port ChatEventPublisher (contrat d'abonnement SSE).

Le port est abstrait : on verifie qu'il impose bien sa methode et qu'une
implementation minimale en memoire honore le contrat (event nomme + payload sur
le canal d'une conversation). Sert aussi de double simple pour la vague 2.
"""

from typing import Any
from uuid import uuid4

import pytest

from app.chat.domain.interfaces.chat_event_publisher import ChatEventPublisher


class _InMemoryChatEventPublisher(ChatEventPublisher):
    """Implementation en memoire : enregistre les evenements publies."""

    def __init__(self) -> None:
        self.published: list[tuple[str, str, dict[str, Any]]] = []

    async def publish(self, conversation_id: Any, event: str, payload: dict[str, Any]) -> None:
        self.published.append((str(conversation_id), event, payload))


class TestChatEventPublisherContrat:
    def test_ne_peut_pas_etre_instancie_directement(self) -> None:
        with pytest.raises(TypeError):
            ChatEventPublisher()  # type: ignore[abstract]

    async def test_publish_enregistre_l_evenement(self) -> None:
        publisher = _InMemoryChatEventPublisher()
        conversation_id = uuid4()

        await publisher.publish(conversation_id, "token", {"delta": "Bon"})

        assert publisher.published == [(str(conversation_id), "token", {"delta": "Bon"})]
