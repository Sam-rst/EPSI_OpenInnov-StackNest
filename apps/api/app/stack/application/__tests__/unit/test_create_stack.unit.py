"""Tests unitaires du use case CreateStack (fakes repo + reader, sans base).

Verifie le contrat de creation : validation structurelle (alias / liens / cycle)
et catalogue (template/version existant et Docker) AVANT toute persistance ; puis
persistance de la stack en `pending` avec ses services (status `pending`) et ses
liens, les alias des liens etant resolus en ids de services. Aucun provisioning
n'est lance au lot 2.
"""

from uuid import uuid4

import pytest

from app.stack.application.__tests__.fakes import (
    FakeStackJobQueue,
    FakeStackRepository,
    FakeStackTemplateReader,
    docker_ref,
    make_create_command,
    make_service_command,
    terraform_ref,
)
from app.stack.application.commands.stack_link_command import StackLinkCommand
from app.stack.application.create_stack import CreateStack
from app.stack.domain.enums.service_status import ServiceStatus
from app.stack.domain.enums.stack_job_kind import StackJobKind
from app.stack.domain.enums.stack_status import StackStatus
from app.stack.domain.exceptions.invalid_stack import InvalidStackException


class TestPersistence:
    async def test_cree_la_stack_pending_avec_services_et_liens(self) -> None:
        repository = FakeStackRepository()
        db_template = uuid4()
        api_template = uuid4()
        reader = FakeStackTemplateReader(
            {(db_template, "16"): docker_ref(), (api_template, "1"): docker_ref("API")}
        )
        owner_id = uuid4()
        command = make_create_command(
            owner_id=owner_id,
            services=(
                make_service_command(template_id=db_template, alias="db", order_index=0),
                make_service_command(
                    template_id=api_template, alias="api", version="1", order_index=1
                ),
            ),
            links=(
                StackLinkCommand(
                    from_alias="api", to_alias="db", var_mappings={"DB_HOST": "{to.alias}"}
                ),
            ),
        )

        stack = await CreateStack(repository=repository, reader=reader).execute(command)

        assert stack.status is StackStatus.PENDING
        assert stack.owner_id == owner_id
        assert len(repository.added_stacks) == 1
        # Deux services persistes, en statut pending.
        services = await repository.list_services(stack.id)
        assert [s.alias for s in services] == ["db", "api"]
        assert all(s.service_status is ServiceStatus.PENDING for s in services)
        assert all(s.stack_id == stack.id for s in services)
        # Le lien resout les alias en ids de services persistes.
        links = await repository.list_links(stack.id)
        assert len(links) == 1
        db_id = next(s.id for s in services if s.alias == "db")
        api_id = next(s.id for s in services if s.alias == "api")
        assert links[0].from_service_id == api_id
        assert links[0].to_service_id == db_id
        assert links[0].var_mappings == {"DB_HOST": "{to.alias}"}

    async def test_sans_file_de_jobs_ne_lance_aucun_provisioning(self) -> None:
        # Sans `queue` injectee (ex. tests de persistance pure) : rien a enfiler.
        repository = FakeStackRepository()
        template_id = uuid4()
        reader = FakeStackTemplateReader({(template_id, "16"): docker_ref()})
        command = make_create_command(
            services=(make_service_command(template_id=template_id, alias="db"),)
        )

        stack = await CreateStack(repository=repository, reader=reader).execute(command)

        assert stack is not None

    async def test_enfile_un_job_provision_apres_persistance(self) -> None:
        # Lot 3 : avec une file injectee, un job PROVISION est enfile pour la stack.
        repository = FakeStackRepository()
        template_id = uuid4()
        reader = FakeStackTemplateReader({(template_id, "16"): docker_ref()})
        queue = FakeStackJobQueue()
        command = make_create_command(
            services=(make_service_command(template_id=template_id, alias="db"),)
        )

        stack = await CreateStack(repository=repository, reader=reader, queue=queue).execute(
            command
        )

        assert len(queue.enqueued) == 1
        assert queue.enqueued[0].kind is StackJobKind.PROVISION
        assert queue.enqueued[0].stack_id == stack.id

    async def test_n_enfile_rien_si_la_composition_est_invalide(self) -> None:
        repository = FakeStackRepository()
        template_id = uuid4()
        reader = FakeStackTemplateReader({(template_id, "16"): docker_ref()})
        queue = FakeStackJobQueue()
        command = make_create_command(
            services=(
                make_service_command(template_id=template_id, alias="db", order_index=0),
                make_service_command(template_id=template_id, alias="db", order_index=1),
            )
        )

        with pytest.raises(InvalidStackException):
            await CreateStack(repository=repository, reader=reader, queue=queue).execute(command)

        assert queue.enqueued == []


class TestValidation:
    async def test_composition_invalide_n_est_pas_persistee(self) -> None:
        repository = FakeStackRepository()
        template_id = uuid4()
        reader = FakeStackTemplateReader({(template_id, "16"): docker_ref()})
        # Deux services avec le meme alias -> invalide.
        command = make_create_command(
            services=(
                make_service_command(template_id=template_id, alias="db", order_index=0),
                make_service_command(template_id=template_id, alias="db", order_index=1),
            )
        )

        with pytest.raises(InvalidStackException):
            await CreateStack(repository=repository, reader=reader).execute(command)

        assert repository.added_stacks == []
        assert repository.added_services == []


class TestCatalogCheck:
    async def test_template_inconnu_est_rejete(self) -> None:
        repository = FakeStackRepository()
        reader = FakeStackTemplateReader({})  # aucun template connu
        command = make_create_command(
            services=(make_service_command(template_id=uuid4(), alias="db"),)
        )

        with pytest.raises(InvalidStackException):
            await CreateStack(repository=repository, reader=reader).execute(command)

        assert repository.added_stacks == []

    async def test_template_terraform_est_rejete(self) -> None:
        repository = FakeStackRepository()
        template_id = uuid4()
        reader = FakeStackTemplateReader({(template_id, "1"): terraform_ref()})
        command = make_create_command(
            services=(make_service_command(template_id=template_id, alias="vm", version="1"),)
        )

        with pytest.raises(InvalidStackException):
            await CreateStack(repository=repository, reader=reader).execute(command)

        assert repository.added_stacks == []
