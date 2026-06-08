"""Tests unitaires du handler de jobs worker (PROVISION/STOP/START/DESTROY/REGEN)."""

from uuid import uuid4

from app.deployment.application.__tests__.fakes import (
    FakeDeploymentRepository,
    FakeTemplateProvisioningReader,
    StubSecretGenerator,
    docker_descriptor,
    make_deployment,
)
from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.domain.enums.job_kind import JobKind
from app.deployment.domain.value_objects.deployment_job import DeploymentJob
from app.deployment.infrastructure.provisioner.provisioning_exception import (
    ProvisioningException,
)
from app.deployment.worker.__tests__.fakes import (
    FailingProvisioner,
    FakeEventPublisher,
    FakeProvisioner,
)
from app.deployment.worker.deployment_job_handler import DeploymentJobHandler


class _LogsFailingProvisioner(FakeProvisioner):
    """Provisioner dont la lecture des logs echoue (le reste fonctionne)."""

    async def logs(self, container_ref: str) -> str:
        raise ProvisioningException("logs boom")


def _handler(
    *,
    repository: FakeDeploymentRepository,
    provisioner: FakeProvisioner,
    publisher: FakeEventPublisher,
    reader: FakeTemplateProvisioningReader | None = None,
    secret_generator: StubSecretGenerator | None = None,
) -> DeploymentJobHandler:
    return DeploymentJobHandler(
        repository=repository,
        provisioner=provisioner,
        publisher=publisher,
        reader=reader or FakeTemplateProvisioningReader({}),
        secret_generator=secret_generator or StubSecretGenerator(),
    )


class TestProvision:
    async def test_passe_running_et_stocke_host_port_et_ref(self) -> None:
        template_id = uuid4()
        deployment = make_deployment(
            template_id=template_id,
            status=DeploymentStatus.PENDING,
            host=None,
            published_port=None,
            container_ref=None,
        )
        repository = FakeDeploymentRepository([deployment])
        provisioner = FakeProvisioner()
        publisher = FakeEventPublisher()
        reader = FakeTemplateProvisioningReader(
            {(template_id, deployment.template_version): docker_descriptor()}
        )
        handler = _handler(
            repository=repository,
            provisioner=provisioner,
            publisher=publisher,
            reader=reader,
        )

        await handler.handle(DeploymentJob(JobKind.PROVISION, deployment.id))

        stored = await repository.get_by_id(deployment.id)
        assert stored is not None
        assert stored.status is DeploymentStatus.RUNNING
        assert stored.host == "host-b"
        assert stored.published_port == 32768
        assert stored.params["container_ref"] == "container-new"

    async def test_publie_provisioning_puis_running(self) -> None:
        template_id = uuid4()
        deployment = make_deployment(
            template_id=template_id, status=DeploymentStatus.PENDING, container_ref=None
        )
        repository = FakeDeploymentRepository([deployment])
        publisher = FakeEventPublisher()
        reader = FakeTemplateProvisioningReader(
            {(template_id, deployment.template_version): docker_descriptor()}
        )
        handler = _handler(
            repository=repository,
            provisioner=FakeProvisioner(),
            publisher=publisher,
            reader=reader,
        )

        await handler.handle(DeploymentJob(JobKind.PROVISION, deployment.id))

        assert publisher.statuses() == ["provisioning", "running"]

    async def test_publie_le_secret_une_seule_fois_au_running(self) -> None:
        template_id = uuid4()
        deployment = make_deployment(
            template_id=template_id, status=DeploymentStatus.PENDING, container_ref=None
        )
        repository = FakeDeploymentRepository([deployment])
        publisher = FakeEventPublisher()
        reader = FakeTemplateProvisioningReader(
            {(template_id, deployment.template_version): docker_descriptor()}
        )
        secret_generator = StubSecretGenerator("s3cr3t")
        handler = _handler(
            repository=repository,
            provisioner=FakeProvisioner(),
            publisher=publisher,
            reader=reader,
            secret_generator=secret_generator,
        )

        await handler.handle(DeploymentJob(JobKind.PROVISION, deployment.id))

        assert publisher.secrets() == ["s3cr3t"]
        # access_url present sur l'event running.
        running = next(e for _, e in publisher.events if e.status is DeploymentStatus.RUNNING)
        assert running.access_url == "host-b:32768"

    async def test_secret_jamais_persiste(self) -> None:
        template_id = uuid4()
        deployment = make_deployment(
            template_id=template_id, status=DeploymentStatus.PENDING, container_ref=None
        )
        repository = FakeDeploymentRepository([deployment])
        reader = FakeTemplateProvisioningReader(
            {(template_id, deployment.template_version): docker_descriptor()}
        )
        handler = _handler(
            repository=repository,
            provisioner=FakeProvisioner(),
            publisher=FakeEventPublisher(),
            reader=reader,
            secret_generator=StubSecretGenerator("s3cr3t"),
        )

        await handler.handle(DeploymentJob(JobKind.PROVISION, deployment.id))

        stored = await repository.get_by_id(deployment.id)
        assert stored is not None
        assert "s3cr3t" not in str(stored.params)

    async def test_descripteur_sans_secret_ne_genere_pas_de_secret(self) -> None:
        template_id = uuid4()
        deployment = make_deployment(
            template_id=template_id, status=DeploymentStatus.PENDING, container_ref=None
        )
        repository = FakeDeploymentRepository([deployment])
        publisher = FakeEventPublisher()
        reader = FakeTemplateProvisioningReader(
            {
                (template_id, deployment.template_version): docker_descriptor(
                    secret_env=None, image_repository="nginx", internal_port=80
                )
            }
        )
        secret_generator = StubSecretGenerator()
        handler = _handler(
            repository=repository,
            provisioner=FakeProvisioner(),
            publisher=publisher,
            reader=reader,
            secret_generator=secret_generator,
        )

        await handler.handle(DeploymentJob(JobKind.PROVISION, deployment.id))

        assert secret_generator.calls == 0
        assert publisher.secrets() == []

    async def test_echec_provisioning_passe_failed(self) -> None:
        template_id = uuid4()
        deployment = make_deployment(
            template_id=template_id, status=DeploymentStatus.PENDING, container_ref=None
        )
        repository = FakeDeploymentRepository([deployment])
        publisher = FakeEventPublisher()
        reader = FakeTemplateProvisioningReader(
            {(template_id, deployment.template_version): docker_descriptor()}
        )
        handler = _handler(
            repository=repository,
            provisioner=FailingProvisioner(),
            publisher=publisher,
            reader=reader,
        )

        await handler.handle(DeploymentJob(JobKind.PROVISION, deployment.id))

        stored = await repository.get_by_id(deployment.id)
        assert stored is not None
        assert stored.status is DeploymentStatus.FAILED
        assert publisher.statuses()[-1] == "failed"

    async def test_template_introuvable_passe_failed(self) -> None:
        deployment = make_deployment(status=DeploymentStatus.PENDING, container_ref=None)
        repository = FakeDeploymentRepository([deployment])
        publisher = FakeEventPublisher()
        handler = _handler(
            repository=repository,
            provisioner=FakeProvisioner(),
            publisher=publisher,
            reader=FakeTemplateProvisioningReader({}),  # rien
        )

        await handler.handle(DeploymentJob(JobKind.PROVISION, deployment.id))

        stored = await repository.get_by_id(deployment.id)
        assert stored is not None
        assert stored.status is DeploymentStatus.FAILED

    async def test_deploiement_absent_ne_plante_pas(self) -> None:
        repository = FakeDeploymentRepository([])
        publisher = FakeEventPublisher()
        handler = _handler(
            repository=repository,
            provisioner=FakeProvisioner(),
            publisher=publisher,
        )

        # Ne doit pas lever : job orphelin (deploiement supprime).
        await handler.handle(DeploymentJob(JobKind.PROVISION, uuid4()))

        assert publisher.events == []


class TestStop:
    async def test_arrete_le_conteneur_et_passe_stopped(self) -> None:
        deployment = make_deployment(status=DeploymentStatus.RUNNING)
        repository = FakeDeploymentRepository([deployment])
        provisioner = FakeProvisioner()
        publisher = FakeEventPublisher()
        handler = _handler(repository=repository, provisioner=provisioner, publisher=publisher)

        await handler.handle(DeploymentJob(JobKind.STOP, deployment.id))

        stored = await repository.get_by_id(deployment.id)
        assert stored is not None
        assert stored.status is DeploymentStatus.STOPPED
        assert provisioner.stopped == ["container-abc"]
        assert publisher.statuses()[-1] == "stopped"

    async def test_echec_stop_passe_failed(self) -> None:
        deployment = make_deployment(status=DeploymentStatus.RUNNING)
        repository = FakeDeploymentRepository([deployment])
        publisher = FakeEventPublisher()
        handler = _handler(
            repository=repository,
            provisioner=FailingProvisioner(),
            publisher=publisher,
        )

        await handler.handle(DeploymentJob(JobKind.STOP, deployment.id))

        stored = await repository.get_by_id(deployment.id)
        assert stored is not None
        assert stored.status is DeploymentStatus.FAILED


class TestStart:
    async def test_redemarre_le_conteneur_et_passe_running(self) -> None:
        deployment = make_deployment(
            status=DeploymentStatus.STOPPED, host=None, published_port=None
        )
        repository = FakeDeploymentRepository([deployment])
        provisioner = FakeProvisioner()
        publisher = FakeEventPublisher()
        handler = _handler(repository=repository, provisioner=provisioner, publisher=publisher)

        await handler.handle(DeploymentJob(JobKind.START, deployment.id))

        stored = await repository.get_by_id(deployment.id)
        assert stored is not None
        assert stored.status is DeploymentStatus.RUNNING
        assert stored.published_port == 32768
        assert provisioner.started == ["container-abc"]

    async def test_start_ne_republie_pas_de_secret(self) -> None:
        deployment = make_deployment(status=DeploymentStatus.STOPPED)
        repository = FakeDeploymentRepository([deployment])
        publisher = FakeEventPublisher()
        handler = _handler(
            repository=repository, provisioner=FakeProvisioner(), publisher=publisher
        )

        await handler.handle(DeploymentJob(JobKind.START, deployment.id))

        assert publisher.secrets() == []


class TestDestroy:
    async def test_detruit_le_conteneur_et_passe_destroyed(self) -> None:
        deployment = make_deployment(status=DeploymentStatus.RUNNING)
        repository = FakeDeploymentRepository([deployment])
        provisioner = FakeProvisioner()
        publisher = FakeEventPublisher()
        handler = _handler(repository=repository, provisioner=provisioner, publisher=publisher)

        await handler.handle(DeploymentJob(JobKind.DESTROY, deployment.id))

        stored = await repository.get_by_id(deployment.id)
        assert stored is not None
        assert stored.status is DeploymentStatus.DESTROYED
        assert provisioner.destroyed == ["container-abc"]
        assert "destroyed" in publisher.statuses()

    async def test_echec_destroy_passe_failed(self) -> None:
        deployment = make_deployment(status=DeploymentStatus.RUNNING)
        repository = FakeDeploymentRepository([deployment])
        publisher = FakeEventPublisher()
        handler = _handler(
            repository=repository,
            provisioner=FailingProvisioner(),
            publisher=publisher,
        )

        await handler.handle(DeploymentJob(JobKind.DESTROY, deployment.id))

        stored = await repository.get_by_id(deployment.id)
        assert stored is not None
        assert stored.status is DeploymentStatus.FAILED


class TestRegenerate:
    async def test_recree_le_conteneur_avec_nouveau_secret(self) -> None:
        template_id = uuid4()
        deployment = make_deployment(template_id=template_id, status=DeploymentStatus.RUNNING)
        repository = FakeDeploymentRepository([deployment])
        provisioner = FakeProvisioner()
        publisher = FakeEventPublisher()
        reader = FakeTemplateProvisioningReader(
            {(template_id, deployment.template_version): docker_descriptor()}
        )
        handler = _handler(
            repository=repository,
            provisioner=provisioner,
            publisher=publisher,
            reader=reader,
            secret_generator=StubSecretGenerator("nouveau-secret"),
        )

        await handler.handle(DeploymentJob(JobKind.REGENERATE, deployment.id))

        assert provisioner.recreated[0][1] == "container-abc"
        stored = await repository.get_by_id(deployment.id)
        assert stored is not None
        assert stored.status is DeploymentStatus.RUNNING
        assert stored.params["container_ref"] == "container-new"
        assert publisher.secrets() == ["nouveau-secret"]

    async def test_echec_regenerate_passe_failed(self) -> None:
        template_id = uuid4()
        deployment = make_deployment(template_id=template_id, status=DeploymentStatus.RUNNING)
        repository = FakeDeploymentRepository([deployment])
        publisher = FakeEventPublisher()
        reader = FakeTemplateProvisioningReader(
            {(template_id, deployment.template_version): docker_descriptor()}
        )
        handler = _handler(
            repository=repository,
            provisioner=FailingProvisioner(),
            publisher=publisher,
            reader=reader,
        )

        await handler.handle(DeploymentJob(JobKind.REGENERATE, deployment.id))

        stored = await repository.get_by_id(deployment.id)
        assert stored is not None
        assert stored.status is DeploymentStatus.FAILED


class TestRunningLogs:
    async def test_publie_les_logs_du_conteneur_au_running(self) -> None:
        template_id = uuid4()
        deployment = make_deployment(
            template_id=template_id, status=DeploymentStatus.PENDING, container_ref=None
        )
        repository = FakeDeploymentRepository([deployment])
        publisher = FakeEventPublisher()
        reader = FakeTemplateProvisioningReader(
            {(template_id, deployment.template_version): docker_descriptor()}
        )
        provisioner = FakeProvisioner(logs_output="ligne 1\nligne 2")
        handler = _handler(
            repository=repository,
            provisioner=provisioner,
            publisher=publisher,
            reader=reader,
        )

        await handler.handle(DeploymentJob(JobKind.PROVISION, deployment.id))

        # Les logs du conteneur (lus via Provisioner.logs) sont diffuses.
        assert "ligne 1" in " ".join(publisher.messages())
        assert provisioner.logs_calls == ["container-new"]

    async def test_logs_indisponibles_n_empechent_pas_le_running(self) -> None:
        # La lecture des logs est best-effort : un echec ne fait pas basculer en
        # failed, le deploiement reste running.
        template_id = uuid4()
        deployment = make_deployment(
            template_id=template_id, status=DeploymentStatus.PENDING, container_ref=None
        )
        repository = FakeDeploymentRepository([deployment])
        publisher = FakeEventPublisher()
        reader = FakeTemplateProvisioningReader(
            {(template_id, deployment.template_version): docker_descriptor()}
        )
        handler = _handler(
            repository=repository,
            provisioner=_LogsFailingProvisioner(),
            publisher=publisher,
            reader=reader,
        )

        await handler.handle(DeploymentJob(JobKind.PROVISION, deployment.id))

        stored = await repository.get_by_id(deployment.id)
        assert stored is not None
        assert stored.status is DeploymentStatus.RUNNING
        assert publisher.statuses()[-1] == "running"

    async def test_pas_d_event_log_quand_aucune_ligne(self) -> None:
        # Tail vide : on ne pollue pas le flux avec un message vide.
        template_id = uuid4()
        deployment = make_deployment(
            template_id=template_id, status=DeploymentStatus.PENDING, container_ref=None
        )
        repository = FakeDeploymentRepository([deployment])
        publisher = FakeEventPublisher()
        reader = FakeTemplateProvisioningReader(
            {(template_id, deployment.template_version): docker_descriptor()}
        )
        handler = _handler(
            repository=repository,
            provisioner=FakeProvisioner(logs_output="   "),
            publisher=publisher,
            reader=reader,
        )

        await handler.handle(DeploymentJob(JobKind.PROVISION, deployment.id))

        assert publisher.messages() == []
