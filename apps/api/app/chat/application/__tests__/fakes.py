"""Faux objets et constructeurs partages par les tests du moteur de chat.

Module importable en absolu (nom non pointe, contrairement aux fichiers de test
`test_*.unit.py`) : resolu a la fois par pytest (importlib) et par mypy.
"""

from typing import Any
from uuid import UUID, uuid4

from app.catalog.domain.entities.template import Template
from app.catalog.domain.entities.template_param import TemplateParam
from app.catalog.domain.entities.template_version import TemplateVersion
from app.catalog.domain.enums.engine_kind import EngineKind
from app.catalog.domain.enums.param_type import ParamType
from app.catalog.domain.enums.template_category import TemplateCategory
from app.catalog.domain.value_objects.slug import Slug
from app.chat.domain.entities.chat_action import ChatAction
from app.chat.domain.entities.conversation import Conversation
from app.chat.domain.entities.message import Message
from app.chat.domain.enums.action_status import ActionStatus
from app.chat.domain.interfaces.catalog_reader import CatalogReader
from app.chat.domain.interfaces.chat_action_repository import ChatActionRepository
from app.chat.domain.interfaces.chat_event_publisher import ChatEventPublisher
from app.chat.domain.interfaces.conversation_repository import ConversationRepository
from app.chat.domain.interfaces.deployment_actions import DeploymentActions
from app.chat.domain.interfaces.proposed_action_reader import ProposedActionReader
from app.chat.domain.value_objects.proposed_action import ProposedAction


def make_template(
    *,
    template_id: UUID | None = None,
    slug: str = "postgresql",
    name: str = "PostgreSQL",
    engine: EngineKind = EngineKind.DOCKER,
    versions: list[str] | None = None,
    params: list[TemplateParam] | None = None,
) -> Template:
    """Construit un Template valide (avec versions + params) pour les tests."""
    version_labels = versions if versions is not None else ["16", "15"]
    template_versions = [
        TemplateVersion(
            id=uuid4(),
            version=label,
            is_default=(index == 0),
            is_lts=False,
            eol_date=None,
        )
        for index, label in enumerate(version_labels)
    ]
    return Template(
        id=template_id or uuid4(),
        slug=Slug(slug),
        name=name,
        icon="postgresql.svg",
        category=TemplateCategory.DATABASE,
        provider="PostgreSQL Global Development Group",
        description="Base de donnees relationnelle open source.",
        engine=engine,
        versions=template_versions,
        params=params if params is not None else [],
        image_repository="postgres",
        internal_port=5432,
        secret_env="POSTGRES_PASSWORD",
    )


def make_param(
    *,
    key: str = "db_name",
    label: str = "Nom de la base",
    param_type: ParamType = ParamType.STRING,
    required: bool = True,
    options: dict[str, Any] | None = None,
) -> TemplateParam:
    """Construit un TemplateParam valide pour les tests."""
    return TemplateParam(
        id=uuid4(),
        key=key,
        label=label,
        type=param_type,
        required=required,
        default_value=None,
        options=options,
        order_index=0,
    )


class FakeCatalogReader(CatalogReader):
    """Lecteur de catalogue en memoire pour les tests du moteur de chat."""

    def __init__(self, templates: list[Template] | None = None) -> None:
        self._templates = templates or []
        self._by_id = {template.id: template for template in self._templates}

    async def list_templates(self) -> list[Template]:
        return list(self._templates)

    async def get_template(self, template_id: UUID) -> Template | None:
        return self._by_id.get(template_id)


class FakeConversationRepository(ConversationRepository):
    """Depot de conversations en memoire pour les tests des use cases."""

    def __init__(self, conversations: list[Conversation] | None = None) -> None:
        self._by_id: dict[UUID, Conversation] = {c.id: c for c in (conversations or [])}
        self._messages: dict[UUID, list[Message]] = {}
        self.added_messages: list[Message] = []

    async def add(self, conversation: Conversation) -> Conversation:
        self._by_id[conversation.id] = conversation
        return conversation

    async def get_by_id(self, conversation_id: UUID) -> Conversation | None:
        return self._by_id.get(conversation_id)

    async def list_by_owner(self, owner_id: UUID) -> list[Conversation]:
        return [c for c in self._by_id.values() if c.owner_id == owner_id]

    async def update(self, conversation: Conversation) -> Conversation:
        self._by_id[conversation.id] = conversation
        return conversation

    async def delete(self, conversation_id: UUID) -> None:
        self._by_id.pop(conversation_id, None)
        self._messages.pop(conversation_id, None)

    async def add_message(self, message: Message) -> Message:
        self._messages.setdefault(message.conversation_id, []).append(message)
        self.added_messages.append(message)
        return message

    async def list_messages(self, conversation_id: UUID) -> list[Message]:
        return list(self._messages.get(conversation_id, []))


class FakeChatActionRepository(ChatActionRepository):
    """Depot des actions de chat en memoire pour les tests des use cases."""

    def __init__(self, actions: list[ChatAction] | None = None) -> None:
        self._by_id: dict[UUID, ChatAction] = {a.id: a for a in (actions or [])}
        self.added: list[ChatAction] = []
        self.updated: list[ChatAction] = []

    async def add(self, action: ChatAction) -> ChatAction:
        self._by_id[action.id] = action
        self.added.append(action)
        return action

    async def get_by_id(self, action_id: UUID) -> ChatAction | None:
        return self._by_id.get(action_id)

    async def list_proposed_by_conversation(self, conversation_id: UUID) -> list[ChatAction]:
        return [
            action
            for action in self._by_id.values()
            if action.conversation_id == conversation_id and action.status is ActionStatus.PROPOSED
        ]

    async def update(self, action: ChatAction) -> ChatAction:
        self._by_id[action.id] = action
        self.updated.append(action)
        return action


class FakeProposedActionReader(ProposedActionReader):
    """Lecteur de propositions rejouables en memoire pour les tests des use cases."""

    def __init__(self, proposals: list[ProposedAction] | None = None) -> None:
        self._proposals = list(proposals or [])

    async def list_proposed(self, conversation_id: UUID) -> list[ProposedAction]:
        return list(self._proposals)


class FakeChatEventPublisher(ChatEventPublisher):
    """Publieur d'evenements en memoire : enregistre les events publies."""

    def __init__(self) -> None:
        self.events: list[tuple[UUID, str, dict[str, Any]]] = []

    async def publish(self, conversation_id: UUID, event: str, payload: dict[str, Any]) -> None:
        self.events.append((conversation_id, event, payload))

    def names(self) -> list[str]:
        """Renvoie la liste ordonnee des noms d'evenements publies."""
        return [name for _, name, _ in self.events]

    def tokens(self) -> str:
        """Reconstitue le texte agrege a partir des events `token`."""
        return "".join(payload["delta"] for _, name, payload in self.events if name == "token")


class FakeDeploymentActions(DeploymentActions):
    """Delegue factice : enregistre les appels et renvoie un id deterministe."""

    def __init__(self, deployment_id: str | None = None) -> None:
        self._deployment_id = deployment_id or str(uuid4())
        self.calls: list[tuple[str, dict[str, Any]]] = []

    async def deploy(
        self,
        *,
        owner_id: UUID,
        template_id: UUID,
        version: str,
        name: str,
        params: dict[str, Any],
    ) -> str:
        self.calls.append(
            (
                "deploy",
                {
                    "owner_id": owner_id,
                    "template_id": template_id,
                    "version": version,
                    "name": name,
                    "params": params,
                },
            )
        )
        return self._deployment_id

    async def stop(self, *, owner_id: UUID, deployment_id: UUID) -> str:
        self.calls.append(("stop", {"owner_id": owner_id, "deployment_id": deployment_id}))
        return str(deployment_id)

    async def start(self, *, owner_id: UUID, deployment_id: UUID) -> str:
        self.calls.append(("start", {"owner_id": owner_id, "deployment_id": deployment_id}))
        return str(deployment_id)

    async def regenerate_password(self, *, owner_id: UUID, deployment_id: UUID) -> str:
        self.calls.append(("regenerate", {"owner_id": owner_id, "deployment_id": deployment_id}))
        return str(deployment_id)
