"""Registre central des modeles ORM (point d'import unique pour Alembic).

Alembic autogenere les migrations en comparant la base a `Base.metadata`. Or
un modele n'est enregistre sur ce metadata que lorsque son module est importe.
Ce registre importe explicitement chaque modele de chaque feature afin qu'ils
soient tous visibles d'Alembic (cf. `alembic/env.py` qui importe ce module).

Quand une feature ajoute une table, ajouter son import ici (et SEULEMENT ici) :
c'est l'unique endroit a maintenir pour qu'autogenerate reste exhaustif. Les
modeles sont re-exportes via `__all__` (effet de bord d'enregistrement + import
public), ce qui evite un `# noqa: F401`.
"""

from app.auth.infrastructure.models.user_model import UserModel
from app.catalog.infrastructure.models.template_model import TemplateModel
from app.catalog.infrastructure.models.template_param_model import (
    TemplateParamModel,
)
from app.catalog.infrastructure.models.template_version_model import (
    TemplateVersionModel,
)
from app.chat.infrastructure.models.chat_action_model import ChatActionModel
from app.chat.infrastructure.models.conversation_model import ConversationModel
from app.chat.infrastructure.models.message_model import MessageModel
from app.deployment.infrastructure.models.deployment_model import DeploymentModel
from app.stack.infrastructure.models.stack_link_model import StackLinkModel
from app.stack.infrastructure.models.stack_model import StackModel
from app.stack.infrastructure.models.stack_service_model import StackServiceModel

__all__ = [
    "ChatActionModel",
    "ConversationModel",
    "DeploymentModel",
    "MessageModel",
    "StackLinkModel",
    "StackModel",
    "StackServiceModel",
    "TemplateModel",
    "TemplateParamModel",
    "TemplateVersionModel",
    "UserModel",
]
