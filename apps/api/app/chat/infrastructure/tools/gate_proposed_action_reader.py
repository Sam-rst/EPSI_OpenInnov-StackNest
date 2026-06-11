"""Lecteur de propositions rejouables : reconstruit le recap via la gate.

Implemente `ProposedActionReader` pour le rechargement d'un fil. Recharge les
`ChatAction` encore `proposed` puis rejoue la gate anti-hallucination sur leurs
`args` valides deja persistes — ce qui reproduit EXACTEMENT le `recap` PUBLIC que
l'event SSE `action_proposed` exposait (memes regles de masquage : les `args`
persistes excluent deja les secrets). Aucune duplication de la logique de recap.

Une proposition dont l'entite referencee a disparu (template supprime,
deploiement efface ou non possede) est silencieusement ecartee : la gate leve,
on n'inclut pas la carte orpheline.
"""

from uuid import UUID

import structlog

from app.chat.domain.entities.chat_action import ChatAction
from app.chat.domain.exceptions.invalid_tool_args import InvalidToolArgsException
from app.chat.domain.exceptions.unknown_template import UnknownTemplateException
from app.chat.domain.interfaces.chat_action_repository import ChatActionRepository
from app.chat.domain.interfaces.proposed_action_reader import ProposedActionReader
from app.chat.domain.value_objects.proposed_action import ProposedAction
from app.chat.domain.value_objects.tool_call import ToolCall
from app.chat.infrastructure.tools.action_args_gate import ActionArgsGate
from app.chat.infrastructure.tools.tool_names import ACTION_KIND_TOOLS

_logger = structlog.get_logger(__name__)


class GateProposedActionReader(ProposedActionReader):
    """Reconstruit les propositions rejouables d'un fil via la gate (recap public)."""

    def __init__(
        self, *, actions: ChatActionRepository, gate: ActionArgsGate, owner_id: UUID
    ) -> None:
        self._actions = actions
        self._gate = gate
        self._owner_id = owner_id

    async def list_proposed(self, conversation_id: UUID) -> list[ProposedAction]:
        persisted = await self._actions.list_proposed_by_conversation(conversation_id)
        rebuilt = [await self._rebuild(action) for action in persisted]
        return [proposal for proposal in rebuilt if proposal is not None]

    async def _rebuild(self, action: ChatAction) -> ProposedAction | None:
        call = ToolCall(name=ACTION_KIND_TOOLS[action.kind].value, args=dict(action.args))
        try:
            proposal = await self._gate.validate(call, owner_id=self._owner_id)
        except (InvalidToolArgsException, UnknownTemplateException):
            # Proposition orpheline (entite referencee disparue) : non rejouable.
            _logger.info("chat.proposed_action.stale", action_id=str(action.id))
            return None
        return ProposedAction(
            action_id=action.id,
            message_id=action.message_id,
            kind=action.kind,
            recap=proposal.recap,
        )
