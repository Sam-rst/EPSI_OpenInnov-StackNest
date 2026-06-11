"""Service de domaine ComposeBuilder : genere le compose-file d'une stack.

Pur (aucune I/O) et donc testable par snapshot du YAML produit. Transforme une
stack (services + liens) en `ComposeFile` (cf. spec « Generation du compose-
file ») :

- cle compose = **alias** ; image = `{image_repository}:{version}` (catalogue) ;
- **ports** : publie `internal_port` sur un port hote ephemere (`["<port>"]`,
  Docker assigne le port libre — relu apres `up` par le provisioner) ;
- **environment** = params filtres + secret genere worker-side (si `secret_env`)
  + variables injectees par les `StackLink`, resolues : `{to.alias}` -> nom du
  service compose, `{to.port}` -> port interne du fournisseur, `{to.secret}` ->
  secret genere du fournisseur, `{to.username}` -> compte de connexion par
  defaut, `{to.db_name}` -> param `db_name` du fournisseur ;
- **networks** : `[stack_net]` (bridge commun -> DNS par alias) ;
- **depends_on** : services fournisseurs.

Securite (cf. spec section « Securite ») : le secret genere n'est injecte que
dans l'`environment` du conteneur, et seulement si le template declare un
`secret_env`. Il n'est jamais persiste ni renvoye ; le `ComposeFile` produit
(qui le contient) ne doit pas etre loggue.
"""

from typing import Any
from uuid import UUID

import yaml

from app.deployment.domain.value_objects.template_provisioning import TemplateProvisioning
from app.stack.domain.entities.stack_link import StackLink
from app.stack.domain.entities.stack_service import StackService
from app.stack.domain.value_objects.compose_file import ComposeFile

# Reseau bridge commun a tous les services d'une stack : la resolution DNS par
# alias en depend (un service joint un autre via son alias = nom de service).
_STACK_NETWORK = "stack_net"

# Prefixe du nom de projet compose (`-p stack_{id}`), isole les conteneurs d'une
# stack des autres.
_PROJECT_PREFIX = "stack_"

# Cle de param du fournisseur resolvant `{to.db_name}` dans un var_mapping.
_DB_NAME_PARAM = "db_name"


class ComposeBuilder:
    """Assemble le compose-file d'une stack a partir de ses services et liens."""

    def build(
        self,
        *,
        stack_id: UUID,
        services: list[StackService],
        links: list[StackLink],
        provisioning_by_alias: dict[str, TemplateProvisioning],
        secret_by_alias: dict[str, str | None],
    ) -> ComposeFile:
        """Genere le `ComposeFile` (YAML) du projet `stack_{id}`."""
        services_by_id = {service.id: service for service in services}
        document = {
            "services": {
                service.alias: self._build_service(
                    service, links, services_by_id, provisioning_by_alias, secret_by_alias
                )
                for service in services
            },
            "networks": {_STACK_NETWORK: {"driver": "bridge"}},
        }
        content = yaml.safe_dump(document, sort_keys=True, default_flow_style=False)
        return ComposeFile(project_name=f"{_PROJECT_PREFIX}{stack_id}", content=content)

    def _build_service(
        self,
        service: StackService,
        links: list[StackLink],
        services_by_id: dict[UUID, StackService],
        provisioning_by_alias: dict[str, TemplateProvisioning],
        secret_by_alias: dict[str, str | None],
    ) -> dict[str, Any]:
        provisioning = provisioning_by_alias[service.alias]
        block: dict[str, Any] = {
            "image": f"{provisioning.image_repository}:{service.version}",
            "networks": [_STACK_NETWORK],
        }
        environment = self._build_environment(
            service, links, services_by_id, provisioning_by_alias, secret_by_alias
        )
        if environment:
            block["environment"] = environment
        if provisioning.internal_port is not None:
            block["ports"] = [str(provisioning.internal_port)]
        providers = self._provider_aliases(service, links, services_by_id)
        if providers:
            block["depends_on"] = providers
        return block

    def _build_environment(
        self,
        service: StackService,
        links: list[StackLink],
        services_by_id: dict[UUID, StackService],
        provisioning_by_alias: dict[str, TemplateProvisioning],
        secret_by_alias: dict[str, str | None],
    ) -> dict[str, str]:
        environment: dict[str, str] = {}
        self._inject_secret(environment, service, provisioning_by_alias, secret_by_alias)
        for link in self._links_from(service, links):
            provider = services_by_id[link.to_service_id]
            for env_var, expression in link.var_mappings.items():
                environment[env_var] = self._resolve(
                    expression, provider, provisioning_by_alias, secret_by_alias
                )
        return environment

    @staticmethod
    def _inject_secret(
        environment: dict[str, str],
        service: StackService,
        provisioning_by_alias: dict[str, TemplateProvisioning],
        secret_by_alias: dict[str, str | None],
    ) -> None:
        """Injecte le secret genere dans son `secret_env`, si le template en declare."""
        provisioning = provisioning_by_alias[service.alias]
        secret = secret_by_alias.get(service.alias)
        if provisioning.secret_env is not None and secret is not None:
            environment[provisioning.secret_env] = secret

    def _resolve(
        self,
        expression: str,
        provider: StackService,
        provisioning_by_alias: dict[str, TemplateProvisioning],
        secret_by_alias: dict[str, str | None],
    ) -> str:
        """Resout une expression de var_mapping vers la valeur du fournisseur."""
        provisioning = provisioning_by_alias[provider.alias]
        resolved = {
            "{to.alias}": provider.alias,
            "{to.port}": str(provisioning.internal_port or ""),
            "{to.secret}": secret_by_alias.get(provider.alias) or "",
            "{to.username}": provisioning.connection_username() or "",
            "{to.db_name}": str(provider.params.get(_DB_NAME_PARAM, "")),
        }
        return resolved.get(expression, expression)

    def _provider_aliases(
        self,
        service: StackService,
        links: list[StackLink],
        services_by_id: dict[UUID, StackService],
    ) -> list[str]:
        """Alias des services fournisseurs (cibles des liens partant du service)."""
        return [
            services_by_id[link.to_service_id].alias for link in self._links_from(service, links)
        ]

    @staticmethod
    def _links_from(service: StackService, links: list[StackLink]) -> list[StackLink]:
        """Liens dont `service` est le consommateur (from)."""
        return [link for link in links if link.from_service_id == service.id]
