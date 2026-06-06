"""Tests unitaires de l'adaptateur BcryptPasswordHasher."""

from app.auth.domain.value_objects.password import Password
from app.auth.infrastructure.security.bcrypt_password_hasher import BcryptPasswordHasher


class TestBcryptPasswordHasher:
    def test_hash_ne_renvoie_pas_le_clair(self) -> None:
        hasher = BcryptPasswordHasher()

        digest = hasher.hash(Password("motdepasse1"))

        assert digest != "motdepasse1"
        assert digest.startswith("$2")

    def test_verify_vrai_pour_le_bon_mot_de_passe(self) -> None:
        hasher = BcryptPasswordHasher()
        password = Password("motdepasse1")

        digest = hasher.hash(password)

        assert hasher.verify(password, digest) is True

    def test_verify_faux_pour_un_mauvais_mot_de_passe(self) -> None:
        hasher = BcryptPasswordHasher()

        digest = hasher.hash(Password("motdepasse1"))

        assert hasher.verify(Password("autre12345"), digest) is False

    def test_deux_hash_du_meme_mot_de_passe_different_sel(self) -> None:
        hasher = BcryptPasswordHasher()
        password = Password("motdepasse1")

        assert hasher.hash(password) != hasher.hash(password)

    def test_cout_au_moins_douze(self) -> None:
        hasher = BcryptPasswordHasher()

        digest = hasher.hash(Password("motdepasse1"))

        # Format bcrypt : $2b$<cost>$... — on extrait le cout (>= 12).
        cost = int(digest.split("$")[2])
        assert cost >= 12
