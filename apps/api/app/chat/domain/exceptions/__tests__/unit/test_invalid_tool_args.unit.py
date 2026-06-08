"""Tests unitaires de l'exception InvalidToolArgsException (code + statut)."""

from app.chat.domain.exceptions.invalid_tool_args import InvalidToolArgsException
from app.shared.exceptions.domain_exception import DomainException


class TestInvalidToolArgsException:
    def test_est_une_domain_exception(self) -> None:
        assert issubclass(InvalidToolArgsException, DomainException)

    def test_code_et_statut(self) -> None:
        # 422 : arguments d'outil non conformes au schema du template (gate
        # anti-hallucination, vague 2).
        exc = InvalidToolArgsException()

        assert exc.code == "INVALID_TOOL_ARGS"
        assert exc.http_status == 422

    def test_message_personnalisable(self) -> None:
        exc = InvalidToolArgsException("Parametre 'version' inconnu pour ce template.")

        assert exc.message == "Parametre 'version' inconnu pour ce template."
