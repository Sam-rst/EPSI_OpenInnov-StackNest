"""Tests unitaires des use cases CRUD de conversations.

Couvre creation, liste (isolation owner), detail (404 si non possede), renommage
(404 si non possede) et suppression. Toutes les operations sont isolees par
proprietaire : une conversation d'autrui est traitee comme inexistante.
"""

from uuid import UUID, uuid4

import pytest

from app.chat.application.__tests__.fakes import FakeConversationRepository
from app.chat.application.create_conversation import CreateConversation
from app.chat.application.delete_conversation import DeleteConversation
from app.chat.application.get_conversation import GetConversation
from app.chat.application.list_conversations import ListConversations
from app.chat.application.rename_conversation import RenameConversation
from app.chat.domain.entities.conversation import Conversation
from app.chat.domain.entities.message import Message
from app.chat.domain.enums.message_role import MessageRole
from app.chat.domain.exceptions.conversation_not_found import ConversationNotFoundException


def _conversation(owner_id: UUID, title: str = "Fil") -> Conversation:
    return Conversation(id=uuid4(), owner_id=owner_id, title=title)


class TestCreate:
    async def test_cree_une_conversation_pour_l_owner(self) -> None:
        owner = uuid4()
        repository = FakeConversationRepository()

        conversation = await CreateConversation(repository).execute(
            owner_id=owner, title="Nouveau fil"
        )

        assert conversation.owner_id == owner
        assert conversation.title == "Nouveau fil"
        assert await repository.get_by_id(conversation.id) is not None

    async def test_titre_par_defaut_si_absent(self) -> None:
        conversation = await CreateConversation(FakeConversationRepository()).execute(
            owner_id=uuid4(), title=None
        )

        assert conversation.title.strip() != ""


class TestList:
    async def test_ne_liste_que_les_fils_de_l_owner(self) -> None:
        owner = uuid4()
        repository = FakeConversationRepository(
            [_conversation(owner, "a-moi"), _conversation(uuid4(), "pas-a-moi")]
        )

        result = await ListConversations(repository).execute(owner)

        assert [c.title for c in result] == ["a-moi"]


class TestGet:
    async def test_detail_d_un_fil_possede(self) -> None:
        owner = uuid4()
        conversation = _conversation(owner)
        repository = FakeConversationRepository([conversation])

        result = await GetConversation(repository).execute(
            conversation_id=conversation.id, owner_id=owner
        )

        assert result.id == conversation.id

    async def test_detail_d_un_fil_d_autrui_leve_404(self) -> None:
        conversation = _conversation(uuid4())
        repository = FakeConversationRepository([conversation])

        with pytest.raises(ConversationNotFoundException):
            await GetConversation(repository).execute(
                conversation_id=conversation.id, owner_id=uuid4()
            )

    async def test_list_messages_masque_les_messages_outils(self) -> None:
        # Les messages role=tool (resultats d'outils reinjectes au LLM, ex.
        # « [get_template] {...} ») sont du contexte interne : ils ne doivent pas
        # remonter dans le detail affiche a l'utilisateur (sinon JSON brut a l'ecran).
        owner = uuid4()
        conversation = _conversation(owner)
        repository = FakeConversationRepository([conversation])
        for role, content in (
            (MessageRole.USER, "Deploie un postgres"),
            (MessageRole.TOOL, '[get_template] {"template": {"id": "..."}}'),
            (MessageRole.ASSISTANT, "Quel nom veux-tu ?"),
        ):
            await repository.add_message(
                Message(id=uuid4(), conversation_id=conversation.id, role=role, content=content)
            )

        messages = await GetConversation(repository).list_messages(
            conversation_id=conversation.id, owner_id=owner
        )

        assert [m.role for m in messages] == [MessageRole.USER, MessageRole.ASSISTANT]


class TestRename:
    async def test_renomme_un_fil_possede(self) -> None:
        owner = uuid4()
        conversation = _conversation(owner, "ancien")
        repository = FakeConversationRepository([conversation])

        result = await RenameConversation(repository).execute(
            conversation_id=conversation.id, owner_id=owner, title="nouveau"
        )

        assert result.title == "nouveau"

    async def test_renommage_d_un_fil_d_autrui_leve_404(self) -> None:
        conversation = _conversation(uuid4())
        repository = FakeConversationRepository([conversation])

        with pytest.raises(ConversationNotFoundException):
            await RenameConversation(repository).execute(
                conversation_id=conversation.id, owner_id=uuid4(), title="x"
            )


class TestDelete:
    async def test_supprime_un_fil_possede(self) -> None:
        owner = uuid4()
        conversation = _conversation(owner)
        repository = FakeConversationRepository([conversation])

        await DeleteConversation(repository).execute(
            conversation_id=conversation.id, owner_id=owner
        )

        assert await repository.get_by_id(conversation.id) is None

    async def test_suppression_d_un_fil_d_autrui_leve_404(self) -> None:
        conversation = _conversation(uuid4())
        repository = FakeConversationRepository([conversation])

        with pytest.raises(ConversationNotFoundException):
            await DeleteConversation(repository).execute(
                conversation_id=conversation.id, owner_id=uuid4()
            )
