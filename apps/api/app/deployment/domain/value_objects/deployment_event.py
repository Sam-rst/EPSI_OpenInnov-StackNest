"""Value object DeploymentEvent : evenement de progression diffuse en SSE."""

from dataclasses import dataclass

from app.deployment.domain.enums.deployment_status import DeploymentStatus


@dataclass(frozen=True)
class DeploymentEvent:
    """Evenement de cycle de vie publie sur le canal `deployment:{id}`.

    Immutable : represente une transition observable par l'UI via SSE
    (cf. design section 7). L'`access_url` et le `secret` ne sont renseignes que
    sur l'event « running », diffuse **une seule fois** (cf. design section 8) :
    le mot de passe n'est jamais stocke en clair ni rejoue.

    - `status`     : nouvel etat du deploiement.
    - `message`    : libelle humain optionnel (progression, cause d'echec).
    - `access_url` : `host:port` d'acces (uniquement a l'etat running).
    - `secret`     : mot de passe genere (uniquement a l'etat running, une fois).
    """

    status: DeploymentStatus
    message: str | None = None
    access_url: str | None = None
    secret: str | None = None
