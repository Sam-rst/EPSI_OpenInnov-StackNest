"""Value object LLMChunk : fragment de reponse streame par le LLM."""

from __future__ import annotations

from dataclasses import dataclass

from app.chat.domain.value_objects.tool_call import ToolCall


@dataclass(frozen=True)
class LLMChunk:
    """Fragment emis par le port `LLMProvider` lors du streaming.

    Immutable et **discrimine** : un chunk porte soit un fragment de texte
    (`delta`), soit un appel d'outil (`tool_call`), jamais les deux ni aucun.
    Cette exclusivite (XOR) est garantie par une guard clause — elle est ce qui
    permet a `SendMessage` (vague 2) de router le flux : diffuser le texte en SSE
    ou declencher la sequence de proposition d'action.

    Construire de preference via les fabriques `of_text` / `of_tool_call` plutot
    que le constructeur direct, pour expliciter l'intention.

    - `delta`     : fragment de texte (peut etre la chaine vide), ou None.
    - `tool_call` : appel d'outil emis par le modele, ou None.
    """

    delta: str | None = None
    tool_call: ToolCall | None = None

    def __post_init__(self) -> None:
        has_delta = self.delta is not None
        has_tool_call = self.tool_call is not None
        if has_delta == has_tool_call:
            raise ValueError(
                "LLMChunk doit porter exactement un contenu : texte XOR appel d'outil."
            )

    @classmethod
    def of_text(cls, delta: str) -> LLMChunk:
        """Construit un chunk de texte (fragment de reponse assistant)."""
        return cls(delta=delta, tool_call=None)

    @classmethod
    def of_tool_call(cls, tool_call: ToolCall) -> LLMChunk:
        """Construit un chunk portant un appel d'outil emis par le modele."""
        return cls(delta=None, tool_call=tool_call)

    def is_tool_call(self) -> bool:
        """Vrai si le chunk porte un appel d'outil (et non un fragment texte)."""
        return self.tool_call is not None
