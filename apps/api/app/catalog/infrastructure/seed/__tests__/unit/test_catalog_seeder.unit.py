"""Tests unitaires du CatalogSeeder (idempotence) avec fake repository."""

from app.catalog.application.__tests__.fakes import FakeTemplateRepository
from app.catalog.infrastructure.seed.catalog_seed import CATALOG_SEED
from app.catalog.infrastructure.seed.catalog_seeder import CatalogSeeder

_SEED_SIZE = len(CATALOG_SEED)


class TestCatalogSeeder:
    async def test_premier_seed_insere_tous_les_templates(self) -> None:
        repository = FakeTemplateRepository([])
        seeder = CatalogSeeder(repository)

        inserted = await seeder.seed()

        assert inserted == _SEED_SIZE
        assert len(await repository.list_all()) == _SEED_SIZE

    async def test_second_seed_n_insere_rien(self) -> None:
        repository = FakeTemplateRepository([])
        seeder = CatalogSeeder(repository)

        await seeder.seed()
        inserted_again = await seeder.seed()

        assert inserted_again == 0
        assert len(await repository.list_all()) == _SEED_SIZE

    async def test_seed_partiel_complete_l_existant(self) -> None:
        repository = FakeTemplateRepository([])
        seeder = CatalogSeeder(repository)

        await seeder.seed(dataset=list(CATALOG_SEED[:3]))
        inserted = await seeder.seed()

        assert inserted == _SEED_SIZE - 3
