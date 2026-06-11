"""Assemble une commande applicative en entite de domaine Template.

Mutualise la materialisation Command -> entites entre CreateTemplate et
UpdateTemplate (DRY) : un seul endroit traduit `TemplateCommand` (et ses specs
de versions/params) en agregat `Template`, en deleguant les validations aux
guard clauses du domaine.
"""

from uuid import UUID, uuid4

from app.catalog.application.commands.template_command import (
    ParamSpec,
    TemplateCommand,
    VersionSpec,
)
from app.catalog.domain.entities.template import Template
from app.catalog.domain.entities.template_param import TemplateParam
from app.catalog.domain.entities.template_version import TemplateVersion
from app.catalog.domain.value_objects.slug import Slug


class TemplateAssembler:
    """Traduit une `TemplateCommand` en agregat `Template` (avec id fourni)."""

    @staticmethod
    def to_entity(template_id: UUID, command: TemplateCommand) -> Template:
        return Template(
            id=template_id,
            slug=Slug(command.slug),
            name=command.name,
            icon=command.icon,
            category=command.category,
            provider=command.provider,
            description=command.description,
            popular=command.popular,
            tags=list(command.tags),
            is_active=command.is_active,
            engine=command.engine,
            versions=[TemplateAssembler._to_version(spec) for spec in command.versions],
            params=[TemplateAssembler._to_param(spec) for spec in command.params],
            image_repository=command.image_repository,
            internal_port=command.internal_port,
            secret_env=command.secret_env,
        )

    @staticmethod
    def _to_version(spec: VersionSpec) -> TemplateVersion:
        return TemplateVersion(
            id=uuid4(),
            version=spec.version,
            is_default=spec.is_default,
            is_lts=spec.is_lts,
            eol_date=spec.eol_date,
        )

    @staticmethod
    def _to_param(spec: ParamSpec) -> TemplateParam:
        return TemplateParam(
            id=uuid4(),
            key=spec.key,
            label=spec.label,
            type=spec.type,
            required=spec.required,
            default_value=spec.default_value,
            options=spec.options,
            order_index=spec.order_index,
            env_var=spec.env_var,
        )
