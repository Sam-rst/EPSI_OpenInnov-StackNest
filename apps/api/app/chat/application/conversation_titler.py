"""Service applicatif : génère un titre court de conversation via le LLM."""

from app.chat.domain.enums.message_role import MessageRole
from app.chat.domain.interfaces.llm_provider import LLMProvider
from app.chat.domain.value_objects.chat_message import ChatMessage

# Consigne de titrage : on demande un titre très court, sans ponctuation ni
# guillemets, et UNIQUEMENT le titre (le modèle a tendance à se justifier sinon).
_TITLE_INSTRUCTION = (
    "Tu nommes une conversation a partir de la demande de l'utilisateur. "
    "Resume-la en un titre tres court (3 a 5 mots), en francais, sans guillemets "
    "ni ponctuation finale. Reponds UNIQUEMENT par le titre, rien d'autre.\n\n"
    "Demande : {message}"
)

# Longueur maximale d'un titre persisté (la colonne `title` accepte 200 ; on reste
# bien en deçà, le front tronque de toute façon l'affichage à ~42 caractères).
_MAX_TITLE_LENGTH = 60

# Repli ultime quand la demande elle-même est vide (la colonne refuse le vide).
_DEFAULT_TITLE = "Nouvelle conversation"


def _clean_title(raw: str | None) -> str:
    """Nettoie la sortie brute du modèle : 1re ligne, sans guillemets ni ponctuation.

    Un seul `strip` avec l'ensemble guillemets + ponctuation retire ces caractères
    parasites aux DEUX extrémités, de façon répétée (ex. `"Cluster Redis".` ->
    `Cluster Redis`), sans toucher à la ponctuation interne.
    """
    if not raw or not raw.strip():
        return ""
    first_line = raw.strip().splitlines()[0]
    cleaned = first_line.strip("\"'`«».!?:;, ").strip()
    return cleaned[:_MAX_TITLE_LENGTH].strip()


def _fallback_title(message: str) -> str:
    """Titre de repli dérivé de la demande quand le modèle ne donne rien d'exploitable."""
    collapsed = " ".join(message.split())
    if not collapsed:
        return _DEFAULT_TITLE
    if len(collapsed) <= _MAX_TITLE_LENGTH:
        return collapsed
    head = collapsed[: _MAX_TITLE_LENGTH - 1].rsplit(" ", 1)[0].strip()
    return f"{head or collapsed[: _MAX_TITLE_LENGTH - 1]}…"


class ConversationTitler:
    """Produit un titre court de conversation à partir du 1er message, via le LLM.

    Réutilise le `LLMProvider` configuré (mode `complete`, non streamé, sans
    outils) avec une consigne de titrage minimale. La sortie est nettoyée
    (1re ligne, guillemets/ponctuation retirés, longueur bornée). Si le modèle
    ne renvoie rien d'exploitable, on retombe sur la demande tronquée — le titre
    n'est jamais vide (invariant de l'entité `Conversation`).
    """

    def __init__(self, provider: LLMProvider) -> None:
        self._provider = provider

    async def generate(self, message: str) -> str:
        prompt = ChatMessage(
            role=MessageRole.USER,
            content=_TITLE_INSTRUCTION.format(message=message.strip()),
        )
        chunk = await self._provider.complete([prompt], tools=[])
        return _clean_title(chunk.delta) or _fallback_title(message)
