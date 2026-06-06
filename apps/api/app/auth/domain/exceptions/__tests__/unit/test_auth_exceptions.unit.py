"""Tests unitaires des exceptions metier du domaine auth.

Verifie code, message par defaut et statut HTTP cible de chaque exception
(consommees par le handler global DomainException -> reponse JSON).
"""

from app.auth.domain.exceptions.email_already_used import EmailAlreadyUsedException
from app.auth.domain.exceptions.email_not_verified import EmailNotVerifiedException
from app.auth.domain.exceptions.invalid_credentials import InvalidCredentialsException
from app.auth.domain.exceptions.invalid_token import InvalidTokenException
from app.auth.domain.exceptions.token_expired import TokenExpiredException
from app.shared.exceptions.domain_exception import DomainException


class TestInvalidTokenException:
    def test_code_et_statut(self) -> None:
        exc = InvalidTokenException()

        assert isinstance(exc, DomainException)
        assert exc.code == "INVALID_TOKEN"
        assert exc.http_status == 401
        assert exc.message


class TestTokenExpiredException:
    def test_code_et_statut(self) -> None:
        exc = TokenExpiredException()

        assert exc.code == "TOKEN_EXPIRED"
        assert exc.http_status == 401
        assert exc.message


class TestInvalidCredentialsException:
    def test_code_et_statut(self) -> None:
        exc = InvalidCredentialsException()

        assert exc.code == "INVALID_CREDENTIALS"
        assert exc.http_status == 401
        assert exc.message


class TestEmailAlreadyUsedException:
    def test_code_et_statut(self) -> None:
        exc = EmailAlreadyUsedException()

        assert exc.code == "EMAIL_ALREADY_USED"
        assert exc.http_status == 409
        assert exc.message


class TestEmailNotVerifiedException:
    def test_code_et_statut(self) -> None:
        exc = EmailNotVerifiedException()

        assert exc.code == "EMAIL_NOT_VERIFIED"
        assert exc.http_status == 403
        assert exc.message
