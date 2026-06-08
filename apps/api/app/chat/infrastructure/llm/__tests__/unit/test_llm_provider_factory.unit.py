"""Tests unitaires de la fabrique de LLMProvider (selection par configuration).

La fabrique est TOLERANTE : elle ne doit JAMAIS exiger de cle reelle a la
construction (pas d'appel reseau, pas d'echec au boot). Elle selectionne
l'adaptateur selon `settings.llm_provider` et renvoie une instance configuree ;
un fournisseur inconnu retombe sur un defaut sans planter l'application.
"""

from app.chat.infrastructure.llm.anthropic_provider import AnthropicProvider
from app.chat.infrastructure.llm.llm_provider_factory import build_llm_provider
from app.chat.infrastructure.llm.ollama_provider import OllamaProvider
from app.chat.infrastructure.llm.openai_provider import OpenAIProvider
from app.core.config import Settings


class TestFactory:
    def test_selectionne_openai(self) -> None:
        settings = Settings(llm_provider="openai", llm_api_key="sk-test")

        provider = build_llm_provider(settings)

        assert isinstance(provider, OpenAIProvider)

    def test_selectionne_ollama(self) -> None:
        settings = Settings(llm_provider="ollama")

        provider = build_llm_provider(settings)

        assert isinstance(provider, OllamaProvider)

    def test_selectionne_anthropic(self) -> None:
        settings = Settings(llm_provider="anthropic", llm_api_key="sk-ant")

        provider = build_llm_provider(settings)

        assert isinstance(provider, AnthropicProvider)

    def test_sans_cle_ne_plante_pas_au_boot(self) -> None:
        # Aucune cle fournie : la fabrique construit quand meme l'adaptateur
        # (la cle n'est requise qu'a l'appel reseau effectif, jamais ici).
        settings = Settings(llm_provider="openai", llm_api_key="")

        provider = build_llm_provider(settings)

        assert isinstance(provider, OpenAIProvider)

    def test_fournisseur_inconnu_retombe_sur_ollama_par_defaut(self) -> None:
        settings = Settings(llm_provider="provider-inexistant")

        provider = build_llm_provider(settings)

        assert isinstance(provider, OllamaProvider)
