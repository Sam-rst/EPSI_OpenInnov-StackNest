"""Extraction des charges utiles `data:` d'un flux Server-Sent Events.

Les APIs de streaming d'OpenAI et d'Ollama emettent des lignes `data: <json>`
separees par des lignes vides. Ce helper isole la charge utile de chaque ligne
`data:`, ignorant les lignes vides et les commentaires SSE (prefixe `:`),
partage par les adaptateurs LLM qui consomment du SSE.
"""

from collections.abc import AsyncIterator

_DATA_PREFIX = "data:"


async def iter_sse_data(lines: AsyncIterator[str]) -> AsyncIterator[str]:
    """Renvoie la charge utile de chaque ligne `data:` du flux (trimee)."""
    async for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith(":"):
            continue
        if stripped.startswith(_DATA_PREFIX):
            yield stripped[len(_DATA_PREFIX) :].strip()
