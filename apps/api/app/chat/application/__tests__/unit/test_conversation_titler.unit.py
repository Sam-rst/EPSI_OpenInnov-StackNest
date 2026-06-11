"""Tests unitaires du service ConversationTitler (titre auto via LLM)."""

from app.chat.application.conversation_titler import ConversationTitler
from app.chat.infrastructure.llm.fake_llm_provider import FakeLLMProvider


class TestConversationTitler:
    async def test_resume_la_demande_en_titre_court(self) -> None:
        titler = ConversationTitler(FakeLLMProvider(text="Déploiement PostgreSQL 16"))

        title = await titler.generate("Déploie un postgres 16 isolé pour mon projet")

        assert title == "Déploiement PostgreSQL 16"

    async def test_nettoie_guillemets_et_ponctuation_finale(self) -> None:
        titler = ConversationTitler(FakeLLMProvider(text='"Cluster Redis".'))

        title = await titler.generate("Je veux un redis")

        assert title == "Cluster Redis"

    async def test_garde_la_premiere_ligne_seulement(self) -> None:
        titler = ConversationTitler(FakeLLMProvider(text="Stack web\nExplication superflue"))

        title = await titler.generate("Monte-moi une stack web")

        assert title == "Stack web"

    async def test_repli_sur_la_demande_si_le_modele_renvoie_vide(self) -> None:
        titler = ConversationTitler(FakeLLMProvider(text="   "))

        title = await titler.generate("Je veux un petit serveur node")

        assert title.strip() != ""
        assert "node" in title.lower()

    async def test_tronque_un_titre_trop_long(self) -> None:
        titler = ConversationTitler(FakeLLMProvider(text="Titre " * 40))

        title = await titler.generate("peu importe")

        assert len(title) <= 60
