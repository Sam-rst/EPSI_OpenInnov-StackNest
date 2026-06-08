"""Tests d'integration du SqlAlchemyChatActionRepository contre un Postgres reel.

Demarre un conteneur Postgres (testcontainers), applique les migrations, puis
exerce le repository : creation et relecture d'une action, mise a jour du cycle
de vie (status + deployment_id apres delegation au deploiement). La chaine de FK
(user -> conversation -> message, et deployment pour `deployment_id`) est semee
par fixtures.
"""

import time
from collections.abc import AsyncIterator, Iterator
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from alembic.config import Config
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from testcontainers.postgres import PostgresContainer

from alembic import command
from app.auth.infrastructure.models.user_model import UserModel
from app.catalog.domain.enums.template_category import TemplateCategory
from app.catalog.infrastructure.models.template_model import TemplateModel
from app.chat.domain.entities.chat_action import ChatAction
from app.chat.domain.entities.conversation import Conversation
from app.chat.domain.entities.message import Message
from app.chat.domain.enums.action_kind import ActionKind
from app.chat.domain.enums.action_status import ActionStatus
from app.chat.domain.enums.message_role import MessageRole
from app.chat.infrastructure.repositories.sqlalchemy_chat_action_repository import (
    SqlAlchemyChatActionRepository,
)
from app.chat.infrastructure.repositories.sqlalchemy_conversation_repository import (
    SqlAlchemyConversationRepository,
)
from app.deployment.domain.entities.deployment import Deployment
from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.infrastructure.repositories.sqlalchemy_deployment_repository import (
    SqlAlchemyDeploymentRepository,
)

# integration/ -> __tests__/ -> repositories/ -> infrastructure/ -> chat/
# -> app/ -> apps/api
_API_ROOT = Path(__file__).resolve().parents[6]


def _wait_for_port(container: PostgresContainer, port: int, timeout: float = 60.0) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            container.get_exposed_port(port)
            return
        except (ConnectionError, ValueError, TypeError):
            time.sleep(0.3)
    raise TimeoutError(f"Port {port} not exposed within {timeout}s")


@pytest.fixture(scope="module")
def postgres_container() -> Iterator[PostgresContainer]:
    container = PostgresContainer("postgres:16-alpine", driver="asyncpg")
    container.start()
    try:
        _wait_for_port(container, 5432)
        url = container.get_connection_url()
        config = Config(str(_API_ROOT / "alembic.ini"))
        config.set_main_option("script_location", str(_API_ROOT / "alembic"))
        config.set_main_option("sqlalchemy.url", url)
        command.upgrade(config, "head")
        yield container
    finally:
        container.stop()


@pytest.fixture
async def session(postgres_container: PostgresContainer) -> AsyncIterator[AsyncSession]:
    engine = create_async_engine(postgres_container.get_connection_url())
    factory = async_sessionmaker(bind=engine, expire_on_commit=False)
    async with factory() as opened:
        yield opened
        await opened.rollback()
    await engine.dispose()


async def _seed_user(session: AsyncSession) -> UUID:
    user = UserModel(
        id=uuid4(),
        email=f"user-{uuid4().hex}@stacknest.test",
        password_hash="hash",
    )
    session.add(user)
    await session.flush()
    return user.id


async def _seed_template(session: AsyncSession) -> UUID:
    template = TemplateModel(
        id=uuid4(),
        slug=f"template-{uuid4().hex}",
        name="PostgreSQL",
        icon="database",
        category=TemplateCategory.DATABASE,
        provider="Docker",
        description="Base relationnelle managee.",
    )
    session.add(template)
    await session.flush()
    return template.id


async def _seed_message(session: AsyncSession, owner_id: UUID) -> tuple[UUID, UUID]:
    """Sema un fil + un message assistant, renvoie (conversation_id, message_id)."""
    conversations = SqlAlchemyConversationRepository(session)
    conversation = await conversations.add(Conversation(id=uuid4(), owner_id=owner_id, title="Fil"))
    message = await conversations.add_message(
        Message(
            id=uuid4(),
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content="",
        )
    )
    await session.flush()
    return conversation.id, message.id


async def _seed_deployment(session: AsyncSession, owner_id: UUID, template_id: UUID) -> UUID:
    deployments = SqlAlchemyDeploymentRepository(session)
    deployment = await deployments.add(
        Deployment(
            id=uuid4(),
            owner_id=owner_id,
            template_id=template_id,
            template_version="16",
            name="ma-base",
            status=DeploymentStatus.RUNNING,
        )
    )
    await session.flush()
    return deployment.id


def _action(*, conversation_id: UUID, message_id: UUID) -> ChatAction:
    return ChatAction(
        id=uuid4(),
        conversation_id=conversation_id,
        message_id=message_id,
        kind=ActionKind.DEPLOY,
        args={"template_id": "abc", "version": "16"},
        status=ActionStatus.PROPOSED,
    )


class TestAddAndGet:
    async def test_add_puis_get_by_id_recharge_l_action(self, session: AsyncSession) -> None:
        repository = SqlAlchemyChatActionRepository(session)
        owner_id = await _seed_user(session)
        conversation_id, message_id = await _seed_message(session, owner_id)

        created = await repository.add(
            _action(conversation_id=conversation_id, message_id=message_id)
        )
        await session.commit()

        reloaded = await repository.get_by_id(created.id)
        assert reloaded is not None
        assert reloaded.conversation_id == conversation_id
        assert reloaded.message_id == message_id
        assert reloaded.kind is ActionKind.DEPLOY
        assert reloaded.args == {"template_id": "abc", "version": "16"}
        assert reloaded.status is ActionStatus.PROPOSED
        assert reloaded.deployment_id is None
        assert reloaded.created_at is not None

    async def test_get_by_id_inconnu_renvoie_none(self, session: AsyncSession) -> None:
        repository = SqlAlchemyChatActionRepository(session)

        assert await repository.get_by_id(uuid4()) is None


class TestUpdate:
    async def test_update_renseigne_status_et_deployment_id(self, session: AsyncSession) -> None:
        repository = SqlAlchemyChatActionRepository(session)
        owner_id = await _seed_user(session)
        template_id = await _seed_template(session)
        conversation_id, message_id = await _seed_message(session, owner_id)
        deployment_id = await _seed_deployment(session, owner_id, template_id)
        created = await repository.add(
            _action(conversation_id=conversation_id, message_id=message_id)
        )
        await session.commit()

        created.status = ActionStatus.EXECUTED
        created.deployment_id = str(deployment_id)
        await repository.update(created)
        await session.commit()

        reloaded = await repository.get_by_id(created.id)
        assert reloaded is not None
        assert reloaded.status is ActionStatus.EXECUTED
        assert reloaded.deployment_id == str(deployment_id)
