"""Encodage d'un DeploymentEvent au format Server-Sent Events (SSE).

Traduit l'event de domaine en trame texte `text/event-stream` consommee par
l'`EventSource` du navigateur. Le nom d'evenement SSE reprend le statut (le front
peut s'abonner par type), la charge utile JSON porte les champs de l'event. Le
`secret` n'apparait que sur l'event `running`, diffuse une seule fois : c'est le
seul canal ou il transite (jamais en REST).
"""

import json

from app.deployment.domain.value_objects.deployment_event import DeploymentEvent


def format_deployment_event_sse(event: DeploymentEvent) -> str:
    """Serialise l'event en trame SSE (`event:` + `data:` + ligne vide finale)."""
    payload = {
        "status": event.status.value,
        "message": event.message,
        "access_url": event.access_url,
        "secret": event.secret,
    }
    return f"event: {event.status.value}\ndata: {json.dumps(payload)}\n\n"
