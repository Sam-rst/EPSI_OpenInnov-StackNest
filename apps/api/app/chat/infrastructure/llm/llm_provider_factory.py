"""Fabrique tolerante du LLMProvider (selection par configuration).

Selectionne l'adaptateur selon `settings.llm_provider` et le configure a partir
des settings. TOLERANTE par construction : aucune cle reelle n'est requise, aucun
appel reseau n'est emis ici — la cle n'est lue qu'a l'appel reseau effectif. Un
fournisseur inconnu retombe sur Ollama (defaut local, sans cle) plutot que de
planter l'application au boot (cf. design decision 5, pas de verrouillage
fournisseur).
"""

from app.chat.domain.interfaces.llm_provider import LLMProvider
from app.chat.infrastructure.llm.anthropic_provider import AnthropicProvider
from app.chat.infrastructure.llm.ollama_provider import OllamaProvider
from app.chat.infrastructure.llm.openai_provider import OpenAIProvider
from app.core.config import Settings


def build_llm_provider(settings: Settings) -> LLMProvider:
    """Construit l'adaptateur LLM selectionne par la configuration."""
    provider = settings.llm_provider.strip().lower()
    if provider == "openai":
        return OpenAIProvider(
            api_key=settings.llm_api_key,
            model=settings.llm_model,
            base_url=settings.llm_base_url,
            timeout=settings.llm_timeout_seconds,
        )
    if provider == "anthropic":
        return AnthropicProvider(
            api_key=settings.llm_api_key,
            model=settings.llm_model,
            base_url=settings.llm_base_url,
            timeout=settings.llm_timeout_seconds,
        )
    # `ollama` et tout fournisseur inconnu : defaut local sans cle.
    return OllamaProvider(
        model=settings.llm_model,
        base_url=settings.llm_base_url,
        timeout=settings.llm_timeout_seconds,
    )
