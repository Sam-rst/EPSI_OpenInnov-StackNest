"""Use case CreateDeployment : lance le provisioning d'une ressource du catalogue."""

from collections.abc import Iterable
from typing import Any
from uuid import uuid4

from app.deployment.application.commands.create_deployment_command import (
    CreateDeploymentCommand,
)
from app.deployment.domain.entities.deployment import Deployment
from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.domain.enums.job_kind import JobKind
from app.deployment.domain.exceptions.engine_not_supported import (
    EngineNotSupportedException,
)
from app.deployment.domain.exceptions.template_not_deployable import (
    TemplateNotDeployableException,
)
from app.deployment.domain.exceptions.template_not_found import (
    TemplateNotFoundForDeploymentException,
)
from app.deployment.domain.interfaces.deployment_repository import DeploymentRepository
from app.deployment.domain.interfaces.job_queue import JobQueue
from app.deployment.domain.interfaces.template_provisioning_reader import (
    TemplateProvisioningReader,
)
from app.deployment.domain.services.deployment_params_validator import (
    DeploymentParamsValidator,
)
from app.deployment.domain.value_objects.deployment_job import DeploymentJob
from app.deployment.domain.value_objects.deployment_name import DeploymentName
from app.deployment.domain.value_objects.template_param_spec import TemplateParamSpec


class CreateDeployment:
    """Cree un deploiement `pending` puis enfile son provisioning asynchrone.

    Valide la saisie avant toute persistance (cf. retours QC) :

    1. le nom respecte le format type label DNS (`DeploymentName`, sinon 422) ;
    2. le template existe (port de lecture du catalogue, sinon 404) et utilise le
       moteur `docker` (gate moteur, cf. design section 12, sinon 409) ;
    3. le template est deployable (`is_deployable`, sinon 409 : runtimes langage
       visibles mais bloques au deploiement) ;
    4. les params requis non-secret omis sont remplis avec leur `default_value`
       declaree par le template (les valeurs fournies priment) ;
    5. les params requis du template sont presents et conformes
       (`DeploymentParamsValidator`, sinon 422).

    Le remplissage des defauts (etape 3) precede la validation : un param requis
    non-secret muni d'un `default_value` ne provoque donc pas de 422 quand le
    client (ex. le chat) l'omet, et la valeur par defaut atterrit dans les params
    persistes (donc dans l'env du conteneur, cf. injection #85). Les params secret
    ne sont jamais pre-remplis : leur valeur est generee worker-side, jamais un
    defaut en clair.

    Toute erreur de validation leve une `DomainException` (422/404/409) AVANT
    l'insertion : aucun deploiement invalide n'est persiste ni enfile. Le secret
    n'est PAS genere ici : il le sera au PROVISION par le worker, jamais persiste
    en clair (cf. design section 8). Le job enfile ne transporte que
    `{kind, deployment_id}`.
    """

    def __init__(
        self,
        *,
        repository: DeploymentRepository,
        queue: JobQueue,
        reader: TemplateProvisioningReader,
    ) -> None:
        self._repository = repository
        self._queue = queue
        self._reader = reader

    async def execute(self, command: CreateDeploymentCommand) -> Deployment:
        name = DeploymentName(command.name)
        provisioning = await self._reader.get(command.template_id, command.template_version)
        if provisioning is None:
            raise TemplateNotFoundForDeploymentException()
        if not provisioning.is_docker():
            raise EngineNotSupportedException()
        if not provisioning.is_deployable:
            raise TemplateNotDeployableException()
        params = self._apply_default_values(provisioning.params, command.params)
        DeploymentParamsValidator(provisioning.params).validate(params)

        deployment = Deployment(
            id=uuid4(),
            owner_id=command.owner_id,
            template_id=command.template_id,
            template_version=command.template_version,
            name=name.value,
            status=DeploymentStatus.PENDING,
            params=params,
        )
        persisted = await self._repository.add(deployment)
        await self._queue.enqueue(DeploymentJob(kind=JobKind.PROVISION, deployment_id=persisted.id))
        return persisted

    @staticmethod
    def _apply_default_values(
        specs: Iterable[TemplateParamSpec], provided: dict[str, Any]
    ) -> dict[str, Any]:
        """Complete les params requis non-secret omis avec leur `default_value`.

        Les valeurs fournies par l'utilisateur priment toujours. Les params secret
        sont exclus : leur valeur est generee worker-side, jamais un defaut en clair.
        """
        params = dict(provided)
        for spec in specs:
            if not spec.required or spec.is_secret():
                continue
            if spec.default_value is None:
                continue
            if spec.key not in params or params[spec.key] is None:
                params[spec.key] = spec.default_value
        return params
