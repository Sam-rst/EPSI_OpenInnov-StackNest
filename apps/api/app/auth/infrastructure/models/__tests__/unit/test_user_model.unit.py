"""Tests unitaires du modele ORM UserModel (mapping, sans base reelle)."""

from app.auth.infrastructure.models.user_model import UserModel


class TestUserModelMapping:
    def test_table_users(self) -> None:
        assert UserModel.__tablename__ == "users"

    def test_colonnes_attendues(self) -> None:
        colonnes = set(UserModel.__table__.columns.keys())

        assert colonnes == {
            "id",
            "email",
            "password_hash",
            "role",
            "is_verified",
            "token_version",
            "created_at",
            "updated_at",
        }

    def test_email_unique(self) -> None:
        assert UserModel.__table__.columns["email"].unique is True

    def test_role_par_defaut_user(self) -> None:
        # La valeur server_default est positionnee (defaut SQL cote base).
        assert UserModel.__table__.columns["role"].server_default is not None

    def test_id_est_clef_primaire(self) -> None:
        assert UserModel.__table__.columns["id"].primary_key is True
