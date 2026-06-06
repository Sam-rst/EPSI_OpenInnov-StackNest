"""Tests unitaires de l'enum UserRole."""

from app.auth.domain.enums.user_role import UserRole


class TestUserRole:
    def test_valeurs_metier(self) -> None:
        assert UserRole.USER.value == "user"
        assert UserRole.ADMIN.value == "admin"

    def test_est_une_str_enum(self) -> None:
        # StrEnum : la valeur se serialise directement en chaine.
        assert UserRole.ADMIN.value == "admin"
        assert str(UserRole.ADMIN) == "admin"
