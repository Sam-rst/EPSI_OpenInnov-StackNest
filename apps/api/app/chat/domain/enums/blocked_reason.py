"""Motif de blocage du deploiement d'un template, expose au modele du chat."""

from enum import StrEnum


class BlockedReason(StrEnum):
    """Pourquoi un template du catalogue n'est pas (encore) deployable.

    Discriminateur expose au LLM (via les outils de lecture) et reutilise par la
    gate anti-hallucination pour formuler un refus honnete. Permet a l'assistant
    d'expliquer la cause au lieu de proposer un deploiement voue a l'echec (409).

    - `TERRAFORM` : moteur Terraform (VM, reseau, bucket...) — provisioning IaC
      pas encore branche au MVP.
    - `RUNTIME`   : conteneur Docker mais runtime langage (Node, Python, Go, PHP)
      marque `is_deployable=False` — aucun service long-running utile au MVP.
    """

    TERRAFORM = "terraform"
    RUNTIME = "runtime"
