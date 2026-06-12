"""Tests unitaires du value object TemplateDeployability.

Source de verite unique de la regle de deployabilite cote chat : Docker +
`is_deployable` -> deployable ; Terraform -> bloque (terraform) ; Docker mais
`is_deployable=False` -> bloque (runtime). Partagee par les outils de lecture et
la gate anti-hallucination.
"""

from app.catalog.domain.enums.engine_kind import EngineKind
from app.chat.application.__tests__.fakes import make_template
from app.chat.domain.enums.blocked_reason import BlockedReason
from app.chat.domain.value_objects.template_deployability import TemplateDeployability


class TestFromTemplate:
    def test_docker_deployable_est_deployable_sans_motif(self) -> None:
        template = make_template(engine=EngineKind.DOCKER, is_deployable=True)

        verdict = TemplateDeployability.from_template(template)

        assert verdict.deployable is True
        assert verdict.blocked_reason is None

    def test_terraform_est_bloque_pour_motif_terraform(self) -> None:
        # La gate moteur prime : meme is_deployable=True, Terraform reste bloque.
        template = make_template(engine=EngineKind.TERRAFORM, is_deployable=True)

        verdict = TemplateDeployability.from_template(template)

        assert verdict.deployable is False
        assert verdict.blocked_reason is BlockedReason.TERRAFORM

    def test_runtime_docker_non_deployable_est_bloque_pour_motif_runtime(self) -> None:
        template = make_template(engine=EngineKind.DOCKER, is_deployable=False)

        verdict = TemplateDeployability.from_template(template)

        assert verdict.deployable is False
        assert verdict.blocked_reason is BlockedReason.RUNTIME
