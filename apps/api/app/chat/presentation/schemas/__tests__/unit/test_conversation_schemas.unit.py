"""Tests unitaires des schemas de conversation (rattachement de l'action publique)."""

from uuid import uuid4

from app.chat.domain.entities.message import Message
from app.chat.domain.enums.action_kind import ActionKind
from app.chat.domain.enums.message_role import MessageRole
from app.chat.domain.value_objects.proposed_action import ProposedAction
from app.chat.presentation.schemas.conversation_schemas import (
    MessageActionResponse,
    MessageResponse,
)


def _message(content: str = "Déployer PostgreSQL 16.") -> Message:
    return Message(
        id=uuid4(),
        conversation_id=uuid4(),
        role=MessageRole.ASSISTANT,
        content=content,
    )


class TestMessageActionResponse:
    def test_construit_le_recap_public_depuis_la_proposition(self) -> None:
        message = _message()
        proposal = ProposedAction(
            action_id=uuid4(),
            message_id=message.id,
            kind=ActionKind.DEPLOY,
            recap={"template": "PostgreSQL", "version": "16"},
        )

        action = MessageActionResponse.from_proposal(proposal, restatement=message.content)

        assert action.action_id == proposal.action_id
        assert action.kind is ActionKind.DEPLOY
        assert action.restatement == message.content
        assert action.recap == {"template": "PostgreSQL", "version": "16"}


class TestMessageResponseWithAction:
    def test_action_absente_par_defaut(self) -> None:
        response = MessageResponse.from_entity(_message())

        assert response.action is None

    def test_rattache_l_action_proposee(self) -> None:
        message = _message()
        proposal = ProposedAction(
            action_id=uuid4(),
            message_id=message.id,
            kind=ActionKind.DEPLOY,
            recap={"template": "PostgreSQL"},
        )

        response = MessageResponse.from_entity(message, proposal=proposal)

        assert response.action is not None
        assert response.action.action_id == proposal.action_id
        assert response.action.restatement == message.content
        assert response.action.recap == {"template": "PostgreSQL"}

    def test_serialisation_n_expose_pas_de_secret_brut(self) -> None:
        # Le recap public ne porte que ce que la gate expose (args deja masques) :
        # on verifie qu'aucune cle « password »/secret ne fuite via la serialisation.
        message = _message()
        proposal = ProposedAction(
            action_id=uuid4(),
            message_id=message.id,
            kind=ActionKind.DEPLOY,
            recap={"template": "PostgreSQL", "version": "16"},
        )

        dumped = MessageResponse.from_entity(message, proposal=proposal).model_dump()

        assert "password" not in str(dumped).lower()
        assert "secret" not in str(dumped).lower()
