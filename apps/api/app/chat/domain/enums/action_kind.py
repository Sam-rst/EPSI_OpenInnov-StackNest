"""Natures d'action que le chat peut proposer (tool-calling contraint)."""

from enum import StrEnum


class ActionKind(StrEnum):
    """Nature d'une action proposee par l'assistant a partir d'un appel d'outil.

    Chaque valeur correspond a un outil d'action expose au LLM (cf. design
    section « Outils »). Ces actions ne s'executent jamais directement : elles
    produisent une `ActionProposal` que l'utilisateur confirme, puis sont
    deleguees au use case de deploiement existant.

    `destroy` est volontairement absent : detruire est irreversible et reste
    dans l'UI de deploiement au MVP (cf. design decision 2, renvoye en V2).

    - `deploy`     : provisionner une ressource a partir d'un template.
    - `stop`       : arreter un deploiement existant.
    - `start`      : redemarrer un deploiement arrete.
    - `regenerate` : regenerer le secret (mot de passe) d'un deploiement.
    """

    DEPLOY = "deploy"
    STOP = "stop"
    START = "start"
    REGENERATE = "regenerate"
