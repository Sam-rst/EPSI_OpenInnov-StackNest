"""Tests unitaires du CatalogSeeder (idempotence) avec fake repository."""

from app.catalog.application.__tests__.fakes import FakeTemplateRepository
from app.catalog.infrastructure.seed.catalog_seed import CATALOG_SEED
from app.catalog.infrastructure.seed.catalog_seeder import CatalogSeeder


class TestCatalogSeeder:
    async def test_premier_seed_insere_les_douze_templates(self) -> None:
        repository = FakeTemplateRepository([])
        seeder = CatalogSeeder(repository)

        inserted = await seeder.seed()

        assert inserted == 12
        assert len(await repository.list_all()) == 12

    async def test_second_seed_n_insere_rien(self) -> None:
        repository = FakeTemplateRepository([])
        seeder = CatalogSeeder(repository)

        await seeder.seed()
        inserted_again = await seeder.seed()

        assert inserted_again == 0
        assert len(await repository.list_all()) == 12

    async def test_seed_partiel_complete_l_existant(self) -> None:
        repository = FakeTemplateRepository([])
        seeder = CatalogSeeder(repository)

        await seeder.seed(dataset=list(CATALOG_SEED[:3]))
        inserted = await seeder.seed()

        assert inserted == 9
