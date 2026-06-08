"""Tests unitaires de l'exception UnknownTemplateException (code + statut)."""

from app.chat.domain.exceptions.unknown_template import UnknownTemplateException
from app.shared.exceptions.domain_exception import DomainException


class TestUnknownTemplateException:
    def test_est_une_domain_exception(self) -> None:
        assert issubclass(UnknownTemplateException, DomainException)

    def test_code_et_statut(self) -> None:
        # 404 : le LLM a reference un template absent du catalogue (boite a
        # outils fermee, 1re couche anti-hallucination).
        exc = UnknownTemplateException()

        assert exc.code == "UNKNOWN_TEMPLATE"
        assert exc.http_status == 404

    def test_message_personnalisable(self) -> None:
        exc = UnknownTemplateException("Template 'mongodb' absent du catalogue.")

        assert exc.message == "Template 'mongodb' absent du catalogue."
