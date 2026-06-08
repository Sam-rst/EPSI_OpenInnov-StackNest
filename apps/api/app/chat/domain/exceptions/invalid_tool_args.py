"""Exception metier : arguments d'appel d'outil non conformes au catalogue."""

from app.shared.exceptions.domain_exception import DomainException


class InvalidToolArgsException(DomainException):
    """Levee quand les arguments d'un appel d'outil sont invalides.

    2e couche anti-hallucination (cf. design section 8) : la gate (vague 2)
    rejette un `template_id` / `version` / `param` absent ou non conforme au
    schema du template. Transformee en HTTP 422 Unprocessable Entity par le
    handler global.
    """

    def __init__(self, message: str = "Arguments d'outil invalides.") -> None:
        super().__init__(code="INVALID_TOOL_ARGS", message=message, http_status=422)
