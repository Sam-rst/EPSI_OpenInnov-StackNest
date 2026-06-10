"""Tests d'integration du SqlAlchemyConversationRepository contre un Postgres reel.

Demarre un conteneur Postgres (testcontainers), applique les migrations
(`alembic upgrade head`, tables chat incluses) puis exerce le repository :
creation et relecture des fils, isolation par proprietaire, renommage,
suppression (cascade des messages), ajout et relecture chronologique des
messages. La FK `owner_id -> users.id` impose qu'un utilisateur existe : il est
seme par fixture.
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
from app.chat.domain.entities.conversation import Conversation
from app.chat.domain.entities.message import Message
from app.chat.domain.enums.message_role import MessageRole
from app.chat.infrastructure.repositories.sqlalchemy_conversation_repository import (
    SqlAlchemyConversationRepository,
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


def _conversation(*, owner_id: UUID, title: str = "Mes tests") -> Conversation:
    return Conversation(id=uuid4(), owner_id=owner_id, title=title)


class TestAddAndGet:
    async def test_add_puis_get_by_id_recharge_le_fil(self, session: AsyncSession) -> None:
        repository = SqlAlchemyConversationRepository(session)
        owner_id = await _seed_user(session)

        created = await repository.add(_conversation(owner_id=owner_id))
        await session.commit()

        reloaded = await repository.get_by_id(created.id)
        assert reloaded is not None
        assert reloaded.owner_id == owner_id
        assert reloaded.title == "Mes tests"
        assert reloaded.created_at is not None
        assert reloaded.updated_at is not None

    async def test_get_by_id_inconnu_renvoie_none(self, session: AsyncSession) -> None:
        repository = SqlAlchemyConversationRepository(session)

        assert await repository.get_by_id(uuid4()) is None


class TestListByOwner:
    async def test_list_by_owner_isole_par_proprietaire(self, session: AsyncSession) -> None:
        repository = SqlAlchemyConversationRepository(session)
        owner_id = await _seed_user(session)
        other_owner_id = await _seed_user(session)

        await repository.add(_conversation(owner_id=owner_id, title="a"))
        await repository.add(_conversation(owner_id=owner_id, title="b"))
        await repository.add(_conversation(owner_id=other_owner_id, title="c"))
        await session.commit()

        mine = await repository.list_by_owner(owner_id)
        assert {c.title for c in mine} == {"a", "b"}
        assert all(c.owner_id == owner_id for c in mine)


class TestUpdate:
    async def test_update_renomme_le_fil(self, session: AsyncSession) -> None:
        repository = SqlAlchemyConversationRepository(session)
        owner_id = await _seed_user(session)
        created = await repository.add(_conversation(owner_id=owner_id))
        await session.commit()

        created.title = "Renomme"
        await repository.update(created)
        await session.commit()

        reloaded = await repository.get_by_id(created.id)
        assert reloaded is not None
        assert reloaded.title == "Renomme"


class TestMessages:
    async def test_add_message_puis_list_messages_chronologique(
        self, session: AsyncSession
    ) -> None:
        repository = SqlAlchemyConversationRepository(session)
        owner_id = await _seed_user(session)
        conversation = await repository.add(_conversation(owner_id=owner_id))
        await session.commit()

        await repository.add_message(
            Message(
                id=uuid4(),
                conversation_id=conversation.id,
                role=MessageRole.USER,
                content="Deploie un postgres",
            )
        )
        await repository.add_message(
            Message(
                id=uuid4(),
                conversation_id=conversation.id,
                role=MessageRole.ASSISTANT,
                content="Bien sur.",
            )
        )
        await session.commit()

        messages = await repository.list_messages(conversation.id)
        assert [m.content for m in messages] == ["Deploie un postgres", "Bien sur."]
        assert messages[0].role is MessageRole.USER
        assert messages[0].created_at is not None

    async def test_messages_du_meme_tour_sont_horodates_distinctement(
        self, session: AsyncSession
    ) -> None:
        """Un tour de chat persiste user + assistant + tool dans la MEME transaction.

        Avec `now()` (constant sur toute la transaction) les trois `created_at`
        seraient identiques et `ORDER BY created_at` renverrait un ordre arbitraire
        (« messages dans le desordre »). Le defaut `clock_timestamp()` donne un
        horodatage reel a chaque insertion : les trois messages sont strictement
        ordonnes, donc relus dans l'ordre d'ecriture, de facon deterministe.
        """
        repository = SqlAlchemyConversationRepository(session)
        owner_id = await _seed_user(session)
        conversation = await repository.add(_conversation(owner_id=owner_id))
        await session.commit()

        for role, content in (
            (MessageRole.USER, "premier"),
            (MessageRole.ASSISTANT, "deuxieme"),
            (MessageRole.TOOL, "troisieme"),
        ):
            await repository.add_message(
                Message(
                    id=uuid4(),
                    conversation_id=conversation.id,
                    role=role,
                    content=content,
                )
            )
        await session.commit()

        messages = await repository.list_messages(conversation.id)

        assert [m.content for m in messages] == ["premier", "deuxieme", "troisieme"]
        premier, deuxieme, troisieme = (m.created_at for m in messages)
        assert premier is not None and deuxieme is not None and troisieme is not None
        assert premier < deuxieme < troisieme


class TestDelete:
    async def test_delete_supprime_le_fil_et_ses_messages(self, session: AsyncSession) -> None:
        repository = SqlAlchemyConversationRepository(session)
        owner_id = await _seed_user(session)
        conversation = await repository.add(_conversation(owner_id=owner_id))
        await repository.add_message(
            Message(
                id=uuid4(),
                conversation_id=conversation.id,
                role=MessageRole.USER,
                content="a supprimer",
            )
        )
        await session.commit()

        await repository.delete(conversation.id)
        await session.commit()

        assert await repository.get_by_id(conversation.id) is None
        # Cascade : les messages du fil ont disparu avec lui.
        assert await repository.list_messages(conversation.id) == []
