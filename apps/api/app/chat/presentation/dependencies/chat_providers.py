"""Composition root du slice chat : providers FastAPI des dependances.

Construit les implementations concretes des ports du domaine a partir des
ressources de la requete / du process :

- repositories (conversations, actions) + catalogue + deploiement adosses a la
  session DB de la requete (unit of work par requete) ;
- `LLMProvider` selectionne par configuration (fabrique tolerante, aucune cle
  requise au boot) ;
- publieur / abonne d'evenements via le client Redis pub/sub partage du core ;
- `DeploymentActions` cable sur les use cases reels du slice deploiement.

Tous les providers sont surchargeables par les tests via
`app.dependency_overrides` (faux en memoire), sans Redis ni base reels ni LLM.
"""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalog.infrastructure.repositories.sqlalchemy_template_repository import (
    SqlAlchemyTemplateRepository,
)
from app.chat.domain.interfaces.catalog_reader import CatalogReader
from app.chat.domain.interfaces.chat_action_repository import ChatActionRepository
from app.chat.domain.interfaces.chat_event_publisher import ChatEventPublisher
from app.chat.domain.interfaces.chat_event_subscriber import ChatEventSubscriber
from app.chat.domain.interfaces.conversation_repository import ConversationRepository
from app.chat.domain.interfaces.deployment_actions import DeploymentActions
from app.chat.domain.interfaces.llm_provider import LLMProvider
from app.chat.infrastructure.adapters.catalog_reader_adapter import CatalogReaderAdapter
from app.chat.infrastructure.adapters.deployment_actions_adapter import (
    DeploymentActionsAdapter,
)
from app.chat.infrastructure.events.redis_chat_event_publisher import (
    RedisChatEventPublisher,
)
from app.chat.infrastructure.events.redis_chat_event_subscriber import (
    RedisChatEventSubscriber,
)
from app.chat.infrastructure.llm.llm_provider_factory import build_llm_provider
from app.chat.infrastructure.repositories.sqlalchemy_chat_action_repository import (
    SqlAlchemyChatActionRepository,
)
from app.chat.infrastructure.repositories.sqlalchemy_conversation_repository import (
    SqlAlchemyConversationRepository,
)
from app.core.config import Settings, get_settings
from app.core.database.request_session import get_request_session
from app.core.redis.redis_client import get_redis_client
from app.deployment.domain.interfaces.deployment_repository import DeploymentRepository
from app.deployment.domain.interfaces.job_queue import JobQueue
from app.deployment.infrastructure.reader.catalog_template_provisioning_reader import (
    CatalogTemplateProvisioningReader,
)
from app.deployment.infrastructure.repositories.sqlalchemy_deployment_repository import (
    SqlAlchemyDeploymentRepository,
)
from app.deployment.presentation.dependencies.deployment_providers import (
    get_deployment_repository,
    get_job_queue,
)

SessionDep = Annotated[AsyncSession, Depends(get_request_session)]


def get_conversation_repository(session: SessionDep) -> ConversationRepository:
    """Provider du depot de conversations adosse a la session de la requete."""
    return SqlAlchemyConversationRepository(session)


def get_chat_action_repository(session: SessionDep) -> ChatActionRepository:
    """Provider du depot des actions de chat adosse a la session de la requete."""
    return SqlAlchemyChatActionRepository(session)


def get_catalog_reader(session: SessionDep) -> CatalogReader:
    """Provider du lecteur de catalogue (delegue au repository catalogue)."""
    return CatalogReaderAdapter(SqlAlchemyTemplateRepository(session))


def get_chat_deployment_repository(session: SessionDep) -> DeploymentRepository:
    """Provider du depot de deploiements (lecture pour la gate / executeur chat)."""
    return SqlAlchemyDeploymentRepository(session)


def get_llm_provider(settings: Annotated[Settings, Depends(get_settings)]) -> LLMProvider:
    """Provider du LLM selectionne par configuration (fabrique tolerante)."""
    return build_llm_provider(settings)


def get_chat_event_publisher(
    settings: Annotated[Settings, Depends(get_settings)],
) -> ChatEventPublisher:
    """Provider du publieur d'evenements de chat (Redis pub/sub partage)."""
    return RedisChatEventPublisher(get_redis_client(settings.redis_url))


def get_chat_event_subscriber(
    settings: Annotated[Settings, Depends(get_settings)],
) -> ChatEventSubscriber:
    """Provider de l'abonne aux evenements de chat (Redis pub/sub partage)."""
    return RedisChatEventSubscriber(get_redis_client(settings.redis_url))


def get_deployment_actions(
    repository: Annotated[DeploymentRepository, Depends(get_deployment_repository)],
    queue: Annotated[JobQueue, Depends(get_job_queue)],
    session: SessionDep,
) -> DeploymentActions:
    """Provider de la delegation aux use cases de deploiement (aucune duplication)."""
    reader = CatalogTemplateProvisioningReader(SqlAlchemyTemplateRepository(session))
    return DeploymentActionsAdapter(repository=repository, queue=queue, reader=reader)
