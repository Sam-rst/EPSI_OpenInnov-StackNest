"""Tests unitaires du CatalogSeeder (convergence/upsert) avec fake repository."""

from app.catalog.application.__tests__.fakes import FakeTemplateRepository
from app.catalog.application.commands.template_command import (
    ParamSpec,
    TemplateCommand,
)
from app.catalog.domain.enums.engine_kind import EngineKind
from app.catalog.domain.enums.param_type import ParamType
from app.catalog.domain.enums.template_category import TemplateCategory
from app.catalog.domain.value_objects.slug import Slug
from app.catalog.infrastructure.seed.catalog_seed import CATALOG_SEED
from app.catalog.infrastructure.seed.catalog_seeder import CatalogSeeder

_SEED_SIZE = len(CATALOG_SEED)


def _command(
    *,
    slug: str = "postgresql-16",
    params: list[ParamSpec] | None = None,
    command: list[str] | None = None,
    secret_value_template: str | None = None,
    is_deployable: bool = True,
) -> TemplateCommand:
    """Construit une TemplateCommand minimale valide pour les tests."""
    return TemplateCommand(
        slug=slug,
        name="PostgreSQL",
        icon="database",
        category=TemplateCategory.DATABASE,
        provider="Docker",
        description="Base relationnelle managee.",
        popular=True,
        tags=["SQL"],
        is_active=True,
        engine=EngineKind.DOCKER,
        params=params if params is not None else [],
        command=command,
        secret_value_template=secret_value_template,
        is_deployable=is_deployable,
    )


def _param(*, key: str = "database", env_var: str | None = "POSTGRES_DB") -> ParamSpec:
    return ParamSpec(
        key=key,
        label="Nom de la base",
        type=ParamType.STRING,
        required=False,
        default_value="app",
        options=None,
        order_index=1,
        env_var=env_var,
    )


class TestCatalogSeeder:
    async def test_premier_seed_insere_tous_les_templates(self) -> None:
        repository = FakeTemplateRepository([])
        seeder = CatalogSeeder(repository)

        outcome = await seeder.seed()

        assert outcome.inserted == _SEED_SIZE
        assert outcome.updated == 0
        assert len(await repository.list_all()) == _SEED_SIZE

    async def test_second_seed_sans_changement_ne_touche_rien(self) -> None:
        repository = FakeTemplateRepository([])
        seeder = CatalogSeeder(repository)

        await seeder.seed()
        again = await seeder.seed()

        assert again.inserted == 0
        assert again.updated == 0
        assert len(await repository.list_all()) == _SEED_SIZE

    async def test_seed_partiel_complete_l_existant(self) -> None:
        repository = FakeTemplateRepository([])
        seeder = CatalogSeeder(repository)

        await seeder.seed(dataset=list(CATALOG_SEED[:3]))
        outcome = await seeder.seed()

        assert outcome.inserted == _SEED_SIZE - 3
        assert outcome.updated == 0, "les 3 deja seedes sont inchanges (no-op)"

    async def test_slug_absent_est_insere(self) -> None:
        repository = FakeTemplateRepository([])
        seeder = CatalogSeeder(repository)

        outcome = await seeder.seed(dataset=[_command(params=[_param()])])

        assert outcome.inserted == 1
        assert outcome.updated == 0
        stored = await repository.get_by_slug(Slug("postgresql-16"))
        assert stored is not None
        assert stored.params[0].env_var == "POSTGRES_DB"

    async def test_slug_existant_est_mis_a_jour_en_place(self) -> None:
        repository = FakeTemplateRepository([])
        seeder = CatalogSeeder(repository)
        await seeder.seed(dataset=[_command(params=[_param(env_var=None)])])
        original = await repository.get_by_slug(Slug("postgresql-16"))
        assert original is not None
        original_id = original.id

        outcome = await seeder.seed(dataset=[_command(params=[_param(env_var="POSTGRES_DB")])])

        assert outcome.inserted == 0
        assert outcome.updated == 1
        updated = await repository.get_by_slug(Slug("postgresql-16"))
        assert updated is not None
        assert updated.id == original_id, "l'identite du template doit rester stable"
        assert updated.params[0].env_var == "POSTGRES_DB"

    async def test_ajout_d_un_param_est_reflete_apres_seed(self) -> None:
        repository = FakeTemplateRepository([])
        seeder = CatalogSeeder(repository)
        await seeder.seed(dataset=[_command(params=[_param()])])
        original = await repository.get_by_slug(Slug("postgresql-16"))
        assert original is not None
        original_id = original.id

        outcome = await seeder.seed(
            dataset=[
                _command(
                    params=[
                        _param(),
                        _param(key="schema", env_var="POSTGRES_SCHEMA"),
                    ]
                )
            ]
        )

        assert outcome.updated == 1
        updated = await repository.get_by_slug(Slug("postgresql-16"))
        assert updated is not None
        assert updated.id == original_id
        assert {param.key for param in updated.params} == {"database", "schema"}

    async def test_changement_de_champ_v2_seul_declenche_un_update(self) -> None:
        """Un template dont seuls les champs v2 changent est detecte et mis a jour.

        Regression : `_snapshot` ignorait `command`/`secret_value_template`/
        `is_deployable` -> un template dont seul un champ v2 evoluait n'etait jamais
        reactualise (runtimes restes deployables, Keycloak/Neo4j non configures).
        """
        repository = FakeTemplateRepository([])
        seeder = CatalogSeeder(repository)
        await seeder.seed(dataset=[_command(slug="keycloak")])

        outcome = await seeder.seed(
            dataset=[
                _command(
                    slug="keycloak",
                    is_deployable=False,
                    command=["start-dev"],
                    secret_value_template="neo4j/{secret}",
                )
            ]
        )

        assert outcome.updated == 1
        stored = await repository.get_by_slug(Slug("keycloak"))
        assert stored is not None
        assert stored.is_deployable is False
        assert stored.command == ["start-dev"]
        assert stored.secret_value_template == "neo4j/{secret}"

    async def test_seed_complet_est_idempotent_et_convergent(self) -> None:
        repository = FakeTemplateRepository([])
        seeder = CatalogSeeder(repository)

        first = await seeder.seed()
        second = await seeder.seed()

        assert first.inserted == _SEED_SIZE
        assert first.updated == 0
        assert second.inserted == 0
        assert second.updated == 0, "re-run sans changement = no-op"
        assert len(await repository.list_all()) == _SEED_SIZE
