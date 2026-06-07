"""Tests unitaires des donnees de seed du catalogue (integrite, coherence)."""

from app.catalog.application.commands.template_command import TemplateCommand
from app.catalog.domain.value_objects.slug import Slug
from app.catalog.infrastructure.seed.catalog_seed import CATALOG_SEED

_EXPECTED_SLUGS = {
    "postgresql-16",
    "redis-7",
    "minio",
    "ubuntu-24-04",
    "node-20",
    "python-3-13",
    "nginx",
    "vault",
    "elk",
    "ollama",
    "vpc",
    "s3",
}


class TestSeedDataset:
    def test_contient_douze_templates(self) -> None:
        assert len(CATALOG_SEED) == 12

    def test_slugs_attendus(self) -> None:
        assert {item.slug for item in CATALOG_SEED} == _EXPECTED_SLUGS

    def test_slugs_uniques(self) -> None:
        slugs = [item.slug for item in CATALOG_SEED]

        assert len(slugs) == len(set(slugs))

    def test_chaque_slug_est_valide(self) -> None:
        for item in CATALOG_SEED:
            assert str(Slug(item.slug)) == item.slug


class TestSeedCoherence:
    def test_chaque_template_a_au_moins_une_version(self) -> None:
        for item in CATALOG_SEED:
            assert len(item.versions) >= 1

    def test_chaque_template_a_exactement_une_version_par_defaut(self) -> None:
        for item in CATALOG_SEED:
            defaults = [version for version in item.versions if version.is_default]
            assert len(defaults) == 1, item.slug

    def test_chaque_template_a_au_moins_un_parametre(self) -> None:
        for item in CATALOG_SEED:
            assert len(item.params) >= 1, item.slug

    def test_ordres_des_parametres_sont_uniques(self) -> None:
        for item in CATALOG_SEED:
            orders = [param.order_index for param in item.params]
            assert len(orders) == len(set(orders)), item.slug

    def test_les_items_sont_des_commandes(self) -> None:
        for item in CATALOG_SEED:
            assert isinstance(item, TemplateCommand)
