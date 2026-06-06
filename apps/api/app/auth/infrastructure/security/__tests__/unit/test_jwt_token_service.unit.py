"""Tests unitaires de l'adaptateur JwtTokenService (PyJWT)."""

from uuid import uuid4

import jwt
import pytest

from app.auth.domain.enums.token_purpose import TokenPurpose
from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.exceptions.invalid_token import InvalidTokenException
from app.auth.domain.exceptions.token_expired import TokenExpiredException
from app.auth.infrastructure.security.jwt_token_service import JwtTokenService

_SECRET = "secret-de-test-suffisamment-long-pour-hs256-32o"


def _service(secret: str = _SECRET) -> JwtTokenService:
    return JwtTokenService(secret=secret)


class TestIssueAndDecode:
    def test_roundtrip_restitue_les_claims(self) -> None:
        service = _service()
        subject = uuid4()

        token = service.issue(
            subject=subject,
            purpose=TokenPurpose.ACCESS,
            role=UserRole.ADMIN,
            token_version=7,
            ttl_seconds=900,
        )
        claims = service.decode(token, expected_purpose=TokenPurpose.ACCESS)

        assert claims.subject == subject
        assert claims.purpose is TokenPurpose.ACCESS
        assert claims.role is UserRole.ADMIN
        assert claims.token_version == 7


class TestDecodeErrors:
    def test_jeton_expire_leve_token_expired(self) -> None:
        service = _service()

        token = service.issue(
            subject=uuid4(),
            purpose=TokenPurpose.ACCESS,
            role=UserRole.USER,
            token_version=0,
            ttl_seconds=-1,  # deja expire
        )

        with pytest.raises(TokenExpiredException):
            service.decode(token, expected_purpose=TokenPurpose.ACCESS)

    def test_mauvaise_finalite_leve_invalid_token(self) -> None:
        service = _service()

        token = service.issue(
            subject=uuid4(),
            purpose=TokenPurpose.REFRESH,
            role=UserRole.USER,
            token_version=0,
            ttl_seconds=900,
        )

        with pytest.raises(InvalidTokenException):
            service.decode(token, expected_purpose=TokenPurpose.ACCESS)

    def test_signature_invalide_leve_invalid_token(self) -> None:
        token = _service(secret="bon-secret-suffisamment-long-pour-hs256-aa").issue(
            subject=uuid4(),
            purpose=TokenPurpose.ACCESS,
            role=UserRole.USER,
            token_version=0,
            ttl_seconds=900,
        )

        with pytest.raises(InvalidTokenException):
            _service(secret="autre-secret-suffisamment-long-pour-hs256-bb").decode(
                token, expected_purpose=TokenPurpose.ACCESS
            )

    def test_jeton_malforme_leve_invalid_token(self) -> None:
        service = _service()

        with pytest.raises(InvalidTokenException):
            service.decode("pas-un-jwt", expected_purpose=TokenPurpose.ACCESS)

    def test_claims_invalides_levent_invalid_token(self) -> None:
        # Jeton bien signe et de bonne finalite, mais 'sub' n'est pas un UUID.
        token = jwt.encode(
            {"sub": "pas-un-uuid", "purpose": "access", "role": "user", "token_version": 0},
            _SECRET,
            algorithm="HS256",
        )

        with pytest.raises(InvalidTokenException):
            _service().decode(token, expected_purpose=TokenPurpose.ACCESS)
