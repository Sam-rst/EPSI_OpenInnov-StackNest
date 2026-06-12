"""Use case ConfirmAction : confirme une proposition et delegue au deploiement.

A la confirmation, l'action est rechargee, re-validee (existence + appartenance +
etat `proposed`), puis DELEGUEE aux use cases du slice `deployment` via le port
`DeploymentActions` (aucune duplication de la logique de provisioning). Le statut
de la `ChatAction` passe `executed` (succes) ou `failed` (echec de delegation),
et un event `action_result` est publie dans les deux cas. Le secret n'est jamais
manipule ici : il reste genere cote worker au provisioning (cf. design).
"""

from uuid import UUID

from app.chat.application.action_access import load_pending_owned_action
from app.chat.domain.entities.chat_action import ChatAction
from app.chat.domain.enums.action_kind import ActionKind
from app.chat.domain.enums.action_status import ActionStatus
from app.chat.domain.interfaces.chat_action_repository import ChatActionRepository
from app.chat.domain.interfaces.chat_event_publisher import ChatEventPublisher
from app.chat.domain.interfaces.conversation_repository import ConversationRepository
from app.chat.domain.interfaces.deployment_actions import DeploymentActions
from app.chat.domain.interfaces.stack_actions import StackActions
from app.chat.domain.value_objects.stack_composition_spec import (
    StackLinkSpec,
    StackServiceSpec,
)


class ConfirmAction:
    """Confirme une `ChatAction` proposee puis delegue son execution au slice cible.

    Deploiement (deploy / stop / start / regenerate) -> `DeploymentActions` ;
    composition de stack (compose_stack) -> `StackActions`. La ressource creee
    (deploiement OU stack) est tracee differemment : le `deployment_id` (colonne
    FK vers `deployments`) n'est renseigne QUE pour un deploiement ; un `stack_id`
    n'y est JAMAIS ecrit (il violerait la FK) — il transite uniquement par l'event
    SSE `action_result`. Le secret n'est jamais manipule ici (genere worker-side).
    """

    def __init__(
        self,
        *,
        conversations: ConversationRepository,
        actions: ChatActionRepository,
        publisher: ChatEventPublisher,
        delegate: DeploymentActions,
        stack_delegate: StackActions,
    ) -> None:
        self._conversations = conversations
        self._actions = actions
        self._publisher = publisher
        self._delegate = delegate
        self._stack_delegate = stack_delegate

    async def execute(self, *, action_id: UUID, owner_id: UUID) -> None:
        """Confirme l'action de cet owner et delegue au slice cible (deploiement/stack)."""
        action = await load_pending_owned_action(
            actions=self._actions,
            conversations=self._conversations,
            action_id=action_id,
            owner_id=owner_id,
        )
        is_stack = action.kind is ActionKind.COMPOSE_STACK
        try:
            resource_id = await self._delegate_action(action, owner_id)
        except Exception:
            await self._mark(action, ActionStatus.FAILED, deployment_id=None)
            await self._publish_result(action, success=False, resource_id=None, is_stack=is_stack)
            raise
        # Un stack_id ne va jamais dans la FK deployment_id : seul un deploiement la renseigne.
        await self._mark(
            action, ActionStatus.EXECUTED, deployment_id=None if is_stack else resource_id
        )
        await self._publish_result(action, success=True, resource_id=resource_id, is_stack=is_stack)

    async def _delegate_action(self, action: ChatAction, owner_id: UUID) -> str:
        if action.kind is ActionKind.DEPLOY:
            return await self._delegate.deploy(
                owner_id=owner_id,
                template_id=UUID(action.args["template_id"]),
                version=action.args["version"],
                name=action.args["name"],
                params=dict(action.args.get("params", {})),
            )
        if action.kind is ActionKind.COMPOSE_STACK:
            return await self._delegate_compose_stack(action, owner_id)
        deployment_id = UUID(action.args["deployment_id"])
        if action.kind is ActionKind.STOP:
            return await self._delegate.stop(owner_id=owner_id, deployment_id=deployment_id)
        if action.kind is ActionKind.START:
            return await self._delegate.start(owner_id=owner_id, deployment_id=deployment_id)
        return await self._delegate.regenerate_password(
            owner_id=owner_id, deployment_id=deployment_id
        )

    async def _delegate_compose_stack(self, action: ChatAction, owner_id: UUID) -> str:
        services = tuple(
            StackServiceSpec(
                template_id=UUID(service["template_id"]),
                alias=service["alias"],
                version=service["version"],
                params=dict(service.get("params", {})),
            )
            for service in action.args["services"]
        )
        links = tuple(
            StackLinkSpec(
                from_alias=link["from_alias"],
                to_alias=link["to_alias"],
                var_mappings=dict(link.get("var_mappings", {})),
            )
            for link in action.args.get("links", [])
        )
        return await self._stack_delegate.compose(
            owner_id=owner_id, name=action.args["name"], services=services, links=links
        )

    async def _mark(
        self, action: ChatAction, status: ActionStatus, *, deployment_id: str | None
    ) -> None:
        action.status = status
        if deployment_id is not None:
            action.deployment_id = deployment_id
        await self._actions.update(action)

    async def _publish_result(
        self, action: ChatAction, *, success: bool, resource_id: str | None, is_stack: bool
    ) -> None:
        await self._publisher.publish(
            action.conversation_id,
            "action_result",
            {
                "action_id": str(action.id),
                "kind": action.kind.value,
                "success": success,
                "deployment_id": None if is_stack else resource_id,
                "stack_id": resource_id if is_stack else None,
            },
        )
