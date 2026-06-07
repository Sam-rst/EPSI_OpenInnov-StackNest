"""(De)serialisation JSON d'un DeploymentEvent pour le canal Redis pub/sub.

L'event est diffuse en JSON sur le canal `deployment:{id}` (cf. design section 7),
puis consomme par le flux SSE de l'API. Le `secret` n'est renseigne que sur
l'event « running » et diffuse une seule fois (cf. design section 8).
"""

import json
from typing import Any

from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.domain.value_objects.deployment_event import DeploymentEvent


def serialize_deployment_event(event: DeploymentEvent) -> str:
    """Serialise l'event en chaine JSON (statut + champs optionnels)."""
    payload = {
        "status": event.status.value,
        "message": event.message,
        "access_url": event.access_url,
        "secret": event.secret,
    }
    return json.dumps(payload)


def deserialize_deployment_event(raw: str) -> DeploymentEvent:
    """Reconstruit un DeploymentEvent depuis sa chaine JSON.

    Leve `ValueError` si le statut est absent ou inconnu.
    """
    payload: dict[str, Any] = json.loads(raw)
    return DeploymentEvent(
        status=DeploymentStatus(payload["status"]),
        message=payload.get("message"),
        access_url=payload.get("access_url"),
        secret=payload.get("secret"),
    )
