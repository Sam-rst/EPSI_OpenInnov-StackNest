"""Tests unitaires de la construction des ToolDefinition depuis le catalogue.

Verifie que la boite a outils exposee au LLM (1re couche anti-hallucination) est
fermee : 3 outils de lecture + 4 outils d'action, dont le schema de
`deploy_template` enumere les templates et versions REELS du catalogue (le
modele ne peut referencer que ce qui existe).
"""

from app.chat.application.__tests__.fakes import FakeCatalogReader, make_template
from app.chat.infrastructure.tools.tool_catalog_builder import ToolCatalogBuilder
from app.chat.infrastructure.tools.tool_names import ToolName


class TestToolCatalogBuilder:
    async def test_construit_les_sept_outils_attendus(self) -> None:
        builder = ToolCatalogBuilder(FakeCatalogReader([make_template()]))

        tools = await builder.build()

        names = {tool.name for tool in tools}
        assert names == {member.value for member in ToolName}

    async def test_chaque_outil_a_une_description_non_vide(self) -> None:
        builder = ToolCatalogBuilder(FakeCatalogReader([make_template()]))

        tools = await builder.build()

        assert all(tool.description.strip() for tool in tools)

    async def test_deploy_template_enumere_les_templates_reels(self) -> None:
        postgres = make_template(slug="postgresql", name="PostgreSQL", versions=["16", "15"])
        redis = make_template(slug="redis", name="Redis", versions=["7"])
        builder = ToolCatalogBuilder(FakeCatalogReader([postgres, redis]))

        tools = await builder.build()

        deploy = next(tool for tool in tools if tool.name == ToolName.DEPLOY_TEMPLATE.value)
        template_id_schema = deploy.params_schema["properties"]["template_id"]
        assert str(postgres.id) in template_id_schema["enum"]
        assert str(redis.id) in template_id_schema["enum"]

    async def test_deploy_template_requiert_template_id_et_name(self) -> None:
        builder = ToolCatalogBuilder(FakeCatalogReader([make_template()]))

        tools = await builder.build()

        deploy = next(tool for tool in tools if tool.name == ToolName.DEPLOY_TEMPLATE.value)
        assert "template_id" in deploy.params_schema["required"]
        assert "name" in deploy.params_schema["required"]

    async def test_outils_de_lecture_n_ont_pas_d_argument_obligatoire_sauf_get_template(
        self,
    ) -> None:
        builder = ToolCatalogBuilder(FakeCatalogReader([make_template()]))

        tools = await builder.build()
        by_name = {tool.name: tool for tool in tools}

        assert by_name[ToolName.LIST_CATALOG.value].params_schema.get("required", []) == []
        assert "template_id" in by_name[ToolName.GET_TEMPLATE.value].params_schema["required"]

    async def test_catalogue_vide_construit_tout_de_meme_les_outils(self) -> None:
        builder = ToolCatalogBuilder(FakeCatalogReader([]))

        tools = await builder.build()

        deploy = next(tool for tool in tools if tool.name == ToolName.DEPLOY_TEMPLATE.value)
        assert deploy.params_schema["properties"]["template_id"]["enum"] == []
