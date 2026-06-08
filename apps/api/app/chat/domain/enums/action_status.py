"""Statuts du cycle de vie d'une action de chat (trace auditable)."""

from enum import StrEnum


class ActionStatus(StrEnum):
    """Etat d'une `ChatAction` au fil de la boucle proposition -> execution.

    Cycle de vie (cf. design « Flux de bout en bout ») :

        proposed --> confirmed --> executed
            |             |
            v             v
        rejected        failed

    StrEnum : la valeur se serialise directement en chaine pour le stockage
    (colonne enum Postgres `chat_action_status`) et l'API.

    - `proposed`  : action proposee par l'IA, en attente de confirmation.
    - `confirmed` : confirmee par l'utilisateur, delegation au deploiement en cours.
    - `rejected`  : refusee par l'utilisateur (etat terminal).
    - `executed`  : deleguee avec succes au use case de deploiement (etat terminal).
    - `failed`    : echec de la delegation / execution (etat terminal).
    """

    PROPOSED = "proposed"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    EXECUTED = "executed"
    FAILED = "failed"
