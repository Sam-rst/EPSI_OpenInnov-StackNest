"""Tests unitaires du value object TokenClaims."""

from uuid import uuid4

import pytest

from app.auth.domain.enums.token_purpose import TokenPurpose
from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.value_objects.token_claims import TokenClaims


class TestTokenClaims:
    def test_porte_les_claims_metier(self) -> None:
        subject = uuid4()

        claims = TokenClaims(
            subject=subject,
            purpose=TokenPurpose.ACCESS,
            role=UserRole.ADMIN,
            token_version=3,
        )

        assert claims.subject == subject
        assert claims.purpose is TokenPurpose.ACCESS
        assert claims.role is UserRole.ADMIN
        assert claims.token_version == 3

    def test_est_immutable(self) -> None:
        claims = TokenClaims(
            subject=uuid4(),
            purpose=TokenPurpose.ACCESS,
            role=UserRole.USER,
            token_version=0,
        )

        with pytest.raises(Exception):  # noqa: B017 - FrozenInstanceError selon impl
            claims.token_version = 9  # type: ignore[misc]
