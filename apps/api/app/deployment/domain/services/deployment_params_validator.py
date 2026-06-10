"""Service de domaine : validation des params d'un deploiement vs son template."""

from collections.abc import Iterable
from typing import Any

from app.catalog.domain.enums.param_type import ParamType
from app.deployment.domain.exceptions.invalid_deployment_params import (
    InvalidDeploymentParamsException,
)
from app.deployment.domain.value_objects.template_param_spec import TemplateParamSpec


class DeploymentParamsValidator:
    """Valide les params saisis contre le descripteur de parametres du template.

    Construit a partir des `TemplateParamSpec` du template (port catalogue), il
    verifie a la creation : presence d'une valeur non vide pour chaque param
    requis, et conformite de chaque valeur fournie a son type (`INT`, `BOOL`) ou
    a la liste de choix d'un `SELECT`. Un ecart leve
    `InvalidDeploymentParamsException` (HTTP 422). Les params non declares par le
    template sont ignores (le worker n'injecte que ce que le template attend).
    """

    def __init__(self, specs: Iterable[TemplateParamSpec]) -> None:
        self._specs = tuple(specs)

    def validate(self, params: dict[str, Any]) -> None:
        """Verifie chaque parametre declare ; leve au premier ecart constate."""
        for spec in self._specs:
            self._validate_spec(spec, params)

    def _validate_spec(self, spec: TemplateParamSpec, params: dict[str, Any]) -> None:
        provided = spec.key in params
        value = params.get(spec.key)
        if self._is_empty(value):
            # Les params `secret` sont generes au provisioning par le worker : jamais
            # saisis par l'utilisateur, donc leur absence ne bloque pas la creation
            # (sinon le chat, qui ne transmet aucun secret, ne pourrait rien deployer).
            if spec.required and spec.type is not ParamType.SECRET:
                raise InvalidDeploymentParamsException(
                    f"Le parametre requis « {spec.key} » est manquant ou vide."
                )
            return
        if provided:
            self._validate_value(spec, value)

    def _validate_value(self, spec: TemplateParamSpec, value: Any) -> None:
        if spec.type is ParamType.INT:
            self._validate_int(spec, value)
        elif spec.type is ParamType.BOOL:
            self._validate_bool(spec, value)
        elif spec.type is ParamType.SELECT:
            self._validate_select(spec, value)

    @staticmethod
    def _is_empty(value: Any) -> bool:
        """Vrai si la valeur est absente (None) ou une chaine vide/blanche."""
        return value is None or (isinstance(value, str) and not value.strip())

    @staticmethod
    def _validate_int(spec: TemplateParamSpec, value: Any) -> None:
        if isinstance(value, bool) or not _is_integer(value):
            raise InvalidDeploymentParamsException(
                f"Le parametre « {spec.key} » doit etre un entier."
            )

    @staticmethod
    def _validate_bool(spec: TemplateParamSpec, value: Any) -> None:
        if not isinstance(value, bool):
            raise InvalidDeploymentParamsException(
                f"Le parametre « {spec.key} » doit etre un booleen."
            )

    @staticmethod
    def _validate_select(spec: TemplateParamSpec, value: Any) -> None:
        allowed = spec.allowed_values()
        if value not in allowed:
            raise InvalidDeploymentParamsException(
                f"Le parametre « {spec.key} » doit etre l'une des valeurs : "
                f"{', '.join(str(choice) for choice in allowed)}."
            )


def _is_integer(value: Any) -> bool:
    """Vrai si la valeur est un entier (ou une chaine representant un entier)."""
    if isinstance(value, int):
        return True
    if isinstance(value, str):
        return value.strip().lstrip("-").isdigit()
    return False
