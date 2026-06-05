"""Tests unitaires de l'exception d'infrastructure DatabaseUnavailable."""

from app.core.database.exceptions.database_unavailable_exception import (
    DatabaseUnavailableException,
)
from app.shared.exceptions.domain_exception import DomainException


class TestDatabaseUnavailableException:
    def test_herite_de_domain_exception(self) -> None:
        error = DatabaseUnavailableException("connexion refusee")

        assert isinstance(error, DomainException)

    def test_porte_un_code_un_message_et_un_statut_503(self) -> None:
        error = DatabaseUnavailableException("connexion refusee")

        assert error.code == "DATABASE_UNAVAILABLE"
        assert error.message == "connexion refusee"
        assert error.http_status == 503
