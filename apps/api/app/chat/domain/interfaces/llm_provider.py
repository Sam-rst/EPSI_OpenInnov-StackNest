"""Interface (port) agnostique du fournisseur de LLM."""

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator, Sequence

from app.chat.domain.value_objects.chat_message import ChatMessage
from app.chat.domain.value_objects.llm_chunk import LLMChunk
from app.chat.domain.value_objects.tool_definition import ToolDefinition


class LLMProvider(ABC):
    """Contrat agnostique d'acces a un modele de langage (tool-calling contraint).

    Implemente en infrastructure par des adaptateurs (OpenAI / Ollama / Anthropic
    en vague 2) + un `FakeLLMProvider` deterministe pour les tests. La logique
    metier (messages + definitions d'outils -> reponse ou appel d'outil) est
    identique quel que soit le fournisseur : aucun verrouillage fournisseur
    (cf. design decision 5).

    Deux modes :
    - `stream` : flux de `LLMChunk` (texte token-par-token ou appel d'outil),
      consomme par `SendMessage` pour la diffusion SSE.
    - `complete` : reponse agregee en une fois (meme contrat, sans streaming),
      utile aux cas synchrones et aux tests.
    """

    @abstractmethod
    def stream(
        self,
        messages: Sequence[ChatMessage],
        tools: Sequence[ToolDefinition],
    ) -> AsyncIterator[LLMChunk]:
        """Renvoie un flux asynchrone de fragments (texte ou appel d'outil).

        `tools` est la boite a outils fermee (1re couche anti-hallucination) : le
        modele ne peut referencer que ces outils.
        """

    @abstractmethod
    async def complete(
        self,
        messages: Sequence[ChatMessage],
        tools: Sequence[ToolDefinition],
    ) -> LLMChunk:
        """Renvoie la reponse agregee (un seul `LLMChunk` : texte ou appel d'outil)."""
