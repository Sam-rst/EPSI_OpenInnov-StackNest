"""Traduction d'un schema de requete d'ecriture en commande applicative."""

from app.catalog.application.commands.template_command import (
    ParamSpec,
    TemplateCommand,
    VersionSpec,
)
from app.catalog.presentation.schemas.template_write_request import TemplateWriteRequest


class TemplateRequestMapper:
    """Convertit un `TemplateWriteRequest` (HTTP) en `TemplateCommand` (use case)."""

    @staticmethod
    def to_command(request: TemplateWriteRequest) -> TemplateCommand:
        return TemplateCommand(
            slug=request.slug,
            name=request.name,
            icon=request.icon,
            category=request.category,
            provider=request.provider,
            description=request.description,
            popular=request.popular,
            tags=list(request.tags),
            is_active=request.is_active,
            versions=[
                VersionSpec(
                    version=version.version,
                    is_default=version.is_default,
                    is_lts=version.is_lts,
                    eol_date=version.eol_date,
                )
                for version in request.versions
            ],
            params=[
                ParamSpec(
                    key=param.key,
                    label=param.label,
                    type=param.type,
                    required=param.required,
                    default_value=param.default_value,
                    options=param.options,
                    order_index=param.order_index,
                )
                for param in request.params
            ],
        )
