"""Tests unitaires de la construction des ToolDefinition depuis le catalogue.

Verifie que la boite a outils exposee au LLM (1re couche anti-hallucination) est
fermee : 3 outils de lecture + 5 outils d'action, dont les schemas de
`deploy_template` et `propose_stack` enumerent les templates et versions REELS
(deployables) du catalogue (le modele ne peut referencer que ce qui existe).
"""

from app.catalog.domain.enums.engine_kind import EngineKind
from app.chat.application.__tests__.fakes import FakeCatalogReader, make_template
from app.chat.domain.value_objects.tool_definition import ToolDefinition
from app.chat.infrastructure.tools.tool_catalog_builder import ToolCatalogBuilder
from app.chat.infrastructure.tools.tool_names import ToolName


class TestToolCatalogBuilder:
    async def test_construit_tous_les_outils_attendus(self) -> None:
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


class TestProposeStackTool:
    @staticmethod
    def _propose_stack(tools: list[ToolDefinition]) -> ToolDefinition:
        return next(tool for tool in tools if tool.name == ToolName.PROPOSE_STACK.value)

    async def test_enumere_uniquement_les_templates_deployables(self) -> None:
        postgres = make_template(slug="postgresql", name="PostgreSQL", versions=["16"])
        # Template Terraform (non deployable) : doit etre EXCLU de l'enum stack.
        vm = make_template(slug="vm", name="VM", engine=EngineKind.TERRAFORM, versions=["1"])
        # Runtime Docker non deployable : exclu egalement.
        node = make_template(slug="node", name="Node", is_deployable=False, versions=["20"])
        builder = ToolCatalogBuilder(FakeCatalogReader([postgres, vm, node]))

        tools = await builder.build()

        service_schema = self._propose_stack(tools).params_schema["properties"]["services"]
        template_enum = service_schema["items"]["properties"]["template_id"]["enum"]
        assert str(postgres.id) in template_enum
        assert str(vm.id) not in template_enum
        assert str(node.id) not in template_enum

    async def test_requiert_name_et_services(self) -> None:
        builder = ToolCatalogBuilder(FakeCatalogReader([make_template()]))

        tools = await builder.build()

        schema = self._propose_stack(tools).params_schema
        assert "name" in schema["required"]
        assert "services" in schema["required"]

    async def test_le_schema_decrit_services_et_liens(self) -> None:
        builder = ToolCatalogBuilder(FakeCatalogReader([make_template()]))

        tools = await builder.build()

        properties = self._propose_stack(tools).params_schema["properties"]
        service_item = properties["services"]["items"]["properties"]
        assert "alias" in service_item
        assert "template_id" in service_item
        link_item = properties["links"]["items"]["properties"]
        assert "from_alias" in link_item
        assert "to_alias" in link_item
        assert "var_mappings" in link_item

    async def test_la_description_documente_les_expressions_de_cablage(self) -> None:
        # La description guide le LLM sur les expressions `{to.alias}` etc.
        builder = ToolCatalogBuilder(FakeCatalogReader([make_template()]))

        tools = await builder.build()

        description = self._propose_stack(tools).description
        assert "{to.alias}" in description
        assert "{to.secret}" in description
