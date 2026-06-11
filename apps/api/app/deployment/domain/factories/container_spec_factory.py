"""Factory : construit un ContainerSpec a partir du descripteur d'un template."""

from typing import Any

from app.deployment.domain.value_objects.container_spec import ContainerSpec
from app.deployment.domain.value_objects.template_param_spec import TemplateParamSpec

_DEPLOYMENT_ID_LABEL = "stacknest.deployment_id"

# Cle conventionnelle du parametre pilotant la limite memoire du conteneur (en Mo).
# Ce parametre ne porte pas de variable d'env : il configure `mem_limit` (cf. point 4).
_MEMORY_PARAM_KEY = "memory_mb"

# Limite memoire par defaut (format Docker) quand aucun parametre `memory_mb` n'est
# saisi : valeur de repli historique, suffisante pour un service simple.
_DEFAULT_MEM_LIMIT = "512m"


class ContainerSpecFactory:
    """Assemble la specification figee d'un conteneur a partir d'un template.

    Encapsule trois regles metier (cf. design sections 4 et 8) :

    1. **Image effective** : `{image_repository}:{version}` — toujours derivee du
       catalogue (allowlist), jamais une image arbitraire de l'utilisateur.
    2. **Injection du secret** : si le template declare une variable d'env secrete
       (`secret_env`), le mot de passe genere y est injecte. Sinon (`secret_env`
       null), aucun secret n'est place dans l'env (cas Nginx, ou Redis via args —
       strategie par template hors perimetre domaine MVP).
    3. **Injection des parametres** : chaque parametre **non-secret** declarant une
       variable d'env (`env_var`) et **present dans les valeurs saisies** est
       reporte dans l'env sous `{env_var: str(valeur)}`. C'est ce mapping explicite
       qui rend les services reellement configures (ex. `POSTGRES_DB`).

    **Securite** : un parametre de type `secret` n'est JAMAIS injecte en clair via
    son `env_var` (surface d'injection) — seul `secret_env` recoit le secret genere
    worker-side. Le parametre conventionnel `memory_mb` ne porte pas de variable
    d'env : il pilote `mem_limit` (en Mo), pas l'environnement du conteneur.
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
        param_specs: tuple[TemplateParamSpec, ...] = (),
        deployment_id: str | None = None,
        cpu_limit: float = 1.0,
        mem_limit: str = _DEFAULT_MEM_LIMIT,
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
        env.update(cls._params_env(param_specs=param_specs, params=params))
        labels = {_DEPLOYMENT_ID_LABEL: deployment_id} if deployment_id is not None else {}

        return ContainerSpec(
            image=f"{image_repository.strip()}:{version.strip()}",
            env=env,
            command=None,
            internal_port=internal_port,
            cpu_limit=cpu_limit,
            mem_limit=cls._resolve_mem_limit(params=params, fallback=mem_limit),
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

    @staticmethod
    def _params_env(
        *, param_specs: tuple[TemplateParamSpec, ...], params: dict[str, Any]
    ) -> dict[str, str]:
        """Mappe chaque parametre non-secret configurable en variable d'environnement.

        Un parametre est reporte si, et seulement si : il n'est pas de type secret
        (securite), il declare une `env_var`, et une valeur a ete saisie pour sa cle.
        """
        env: dict[str, str] = {}
        for spec in param_specs:
            if spec.is_secret() or spec.env_var is None or spec.key not in params:
                continue
            env[spec.env_var] = str(params[spec.key])
        return env

    @staticmethod
    def _resolve_mem_limit(*, params: dict[str, Any], fallback: str) -> str:
        """Derive la limite memoire du parametre `memory_mb` (en Mo), sinon le repli."""
        memory_mb = params.get(_MEMORY_PARAM_KEY)
        if memory_mb is None:
            return fallback
        return f"{memory_mb}m"
