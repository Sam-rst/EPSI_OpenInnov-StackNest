"""Factory : construit un ContainerSpec a partir du descripteur d'un template."""

from typing import Any

from app.deployment.domain.value_objects.container_spec import ContainerSpec

_DEPLOYMENT_ID_LABEL = "stacknest.deployment_id"


class ContainerSpecFactory:
    """Assemble la specification figee d'un conteneur a partir d'un template.

    Encapsule deux regles metier (cf. design sections 4 et 8) :

    1. **Image effective** : `{image_repository}:{version}` — toujours derivee du
       catalogue (allowlist), jamais une image arbitraire de l'utilisateur.
    2. **Injection du secret** : si le template declare une variable d'env secrete
       (`secret_env`), le mot de passe genere y est injecte. Sinon (`secret_env`
       null), aucun secret n'est place dans l'env (cas Nginx, ou Redis via args —
       strategie par template hors perimetre domaine MVP).

    Les `params` saisis par l'utilisateur ne sont volontairement PAS reportes
    automatiquement dans l'env du conteneur (surface d'injection) : leur usage
    relevera d'une strategie par template lors des slices ulterieures.
    """

    @classmethod
    def build(
        cls,
        *,
        image_repository: str,
        version: str,
        internal_port: int | None,
        secret_env: str | None,
        params: dict[str, Any],
        secret: str | None,
        deployment_id: str | None = None,
        cpu_limit: float = 1.0,
        mem_limit: str = "512m",
    ) -> ContainerSpec:
        """Construit le `ContainerSpec` du conteneur a provisionner.

        Leve `ValueError` si `image_repository`/`version` sont vides, ou si un
        `secret_env` est declare sans `secret` fourni.
        """
        if not image_repository.strip():
            raise ValueError("ContainerSpecFactory: image_repository vide.")
        if not version.strip():
            raise ValueError("ContainerSpecFactory: version vide.")

        env = cls._build_env(secret_env=secret_env, secret=secret)
        labels = {_DEPLOYMENT_ID_LABEL: deployment_id} if deployment_id is not None else {}

        return ContainerSpec(
            image=f"{image_repository.strip()}:{version.strip()}",
            env=env,
            command=None,
            internal_port=internal_port,
            cpu_limit=cpu_limit,
            mem_limit=mem_limit,
            labels=labels,
        )

    @staticmethod
    def _build_env(*, secret_env: str | None, secret: str | None) -> dict[str, str]:
        """Place le secret dans l'env si une variable cible est declaree."""
        if secret_env is None:
            return {}
        if not secret:
            raise ValueError(
                f"ContainerSpecFactory: secret requis pour la variable {secret_env!r}."
            )
        return {secret_env: secret}
