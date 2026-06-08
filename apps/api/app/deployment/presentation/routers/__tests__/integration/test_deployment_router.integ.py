"""Tests d'integration du router de deploiement (httpx ASGI + fakes infra).

Monte l'application FastAPI complete (`create_app`) et remplace les providers
d'infrastructure du slice deploiement par des faux en memoire (depot, file de
jobs, reader catalogue, abonne aux events). L'authentification utilise des jetons
reels mintes par `JwtTokenService` ; le depot d'utilisateurs est un faux. Couvre :
protection 401, creation 201, isolation owner (liste + 404), gate moteur 409,
actions de cycle de vie 202, transitions illegales 409, et le flux SSE
(`text/event-stream`) qui transporte le secret diffuse une seule fois — secret
qui ne doit JAMAIS apparaitre dans les reponses REST.
"""

from collections.abc import AsyncIterator
from uuid import UUID, uuid4

import httpx
import pytest

from app.auth.domain.entities.user import User
from app.auth.domain.enums.token_purpose import TokenPurpose
from app.auth.domain.enums.user_role import UserRole
from app.auth.domain.value_objects.email import Email
from app.auth.infrastructure.security.jwt_token_service import JwtTokenService
from app.auth.presentation.dependencies.current_user import (
    get_token_service,
    get_user_repository,
)
from app.deployment.application.__tests__.fakes import (
    FakeDeploymentRepository,
    FakeJobQueue,
    FakeTemplateProvisioningReader,
    docker_descriptor,
    make_deployment,
    terraform_descriptor,
)
from app.deployment.domain.enums.deployment_status import DeploymentStatus
from app.deployment.domain.enums.job_kind import JobKind
from app.deployment.domain.interfaces.event_subscriber import EventSubscriber
from app.deployment.domain.value_objects.deployment_event import DeploymentEvent
from app.deployment.presentation.dependencies.deployment_providers import (
    get_deployment_repository,
    get_event_subscriber,
    get_job_queue,
    get_template_provisioning_reader,
)
from app.main import create_app

_SECRET = "secret-de-test-suffisamment-long-pour-hs256-32o"


class _FakeUserRepository:
    def __init__(self, users: list[User]) -> None:
        self._by_id = {str(user.id): user for user in users}

    async def get_by_id(self, user_id: object) -> User | None:
        return self._by_id.get(str(user_id))


class FakeEventSubscriber(EventSubscriber):
    """Abonne en memoire : rejoue une sequence figee d'events puis se termine."""

    def __init__(self, events: list[DeploymentEvent]) -> None:
        self._events = events

    async def subscribe(self, deployment_id: UUID) -> AsyncIterator[DeploymentEvent]:
        for event in self._events:
            yield event


def _make_user(role: UserRole = UserRole.USER) -> User:
    return User(
        id=uuid4(),
        email=Email("user@stacknest.local"),
        password_hash="$2b$12$hash",
        role=role,
        is_verified=True,
        token_version=0,
    )


def _mint(user: User) -> str:
    return JwtTokenService(secret=_SECRET).issue(
        subject=user.id,
        purpose=TokenPurpose.ACCESS,
        role=user.role,
        token_version=user.token_version,
        ttl_seconds=900,
    )


def _auth(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {_mint(user)}"}


@pytest.fixture
async def context() -> AsyncIterator[dict[str, object]]:
    user = _make_user(UserRole.USER)
    other = _make_user(UserRole.USER)

    repository = FakeDeploymentRepository()
    queue = FakeJobQueue()
    template_id = uuid4()
    reader = FakeTemplateProvisioningReader({(template_id, "16"): docker_descriptor()})
    running_event = DeploymentEvent(
        status=DeploymentStatus.RUNNING,
        message="pret",
        access_url="host-b:32768",
        secret="le-secret-affiche-une-fois",
    )
    subscriber = FakeEventSubscriber(
        [DeploymentEvent(status=DeploymentStatus.PROVISIONING), running_event]
    )

    app = create_app()
    app.dependency_overrides[get_token_service] = lambda: JwtTokenService(secret=_SECRET)
    app.dependency_overrides[get_user_repository] = lambda: _FakeUserRepository([user, other])
    app.dependency_overrides[get_deployment_repository] = lambda: repository
    app.dependency_overrides[get_job_queue] = lambda: queue
    app.dependency_overrides[get_template_provisioning_reader] = lambda: reader
    app.dependency_overrides[get_event_subscriber] = lambda: subscriber

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="https://test") as http:
        yield {
            "http": http,
            "user": user,
            "other": other,
            "repository": repository,
            "queue": queue,
            "template_id": template_id,
            "running_secret": running_event.secret,
        }


def _create_body(template_id: UUID) -> dict[str, object]:
    return {
        "template_id": str(template_id),
        "version": "16",
        "name": "ma-base",
        "params": {"db_name": "app"},
    }


class TestProtection:
    async def test_liste_sans_jeton_renvoie_401(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]

        response = await http.get("/deployments")

        assert response.status_code in (401, 403)

    async def test_creation_sans_jeton_renvoie_401(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        template_id: UUID = context["template_id"]  # type: ignore[assignment]

        response = await http.post("/deployments", json=_create_body(template_id))

        assert response.status_code in (401, 403)


class TestCreate:
    async def test_creation_renvoie_201_et_dto_sans_secret(
        self, context: dict[str, object]
    ) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        template_id: UUID = context["template_id"]  # type: ignore[assignment]

        response = await http.post(
            "/deployments", json=_create_body(template_id), headers=_auth(user)
        )

        assert response.status_code == 201, response.text
        body = response.json()
        assert body["name"] == "ma-base"
        assert body["status"] == DeploymentStatus.PENDING.value
        assert body["template_version"] == "16"
        assert "secret" not in body
        # Le provisioning a ete enfile.
        queue: FakeJobQueue = context["queue"]  # type: ignore[assignment]
        assert [job.kind for job in queue.enqueued] == [JobKind.PROVISION]

    async def test_creation_moteur_non_docker_renvoie_409(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        reader = FakeTemplateProvisioningReader({(UUID(int=7), "1"): terraform_descriptor()})
        app = http._transport.app  # type: ignore[attr-defined]
        app.dependency_overrides[get_template_provisioning_reader] = lambda: reader

        response = await http.post(
            "/deployments",
            json={"template_id": str(UUID(int=7)), "version": "1", "name": "tf", "params": {}},
            headers=_auth(user),
        )

        assert response.status_code == 409
        assert response.json()["error"] == "ENGINE_NOT_SUPPORTED"

    async def test_creation_template_inconnu_renvoie_404(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]

        response = await http.post(
            "/deployments",
            json={"template_id": str(uuid4()), "version": "99", "name": "x", "params": {}},
            headers=_auth(user),
        )

        assert response.status_code == 404


class TestListAndGet:
    async def test_liste_ne_renvoie_que_les_deploiements_de_l_owner(
        self, context: dict[str, object]
    ) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        other: User = context["other"]  # type: ignore[assignment]
        repository: FakeDeploymentRepository = context["repository"]  # type: ignore[assignment]
        mine = make_deployment(owner_id=user.id, name="a-moi")
        await repository.add(mine)
        await repository.add(make_deployment(owner_id=other.id, name="pas-a-moi"))

        response = await http.get("/deployments", headers=_auth(user))

        assert response.status_code == 200
        names = [item["name"] for item in response.json()]
        assert names == ["a-moi"]

    async def test_detail_d_un_deploiement_possede_renvoie_200(
        self, context: dict[str, object]
    ) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        repository: FakeDeploymentRepository = context["repository"]  # type: ignore[assignment]
        deployment = make_deployment(owner_id=user.id, name="detail")
        await repository.add(deployment)

        response = await http.get(f"/deployments/{deployment.id}", headers=_auth(user))

        assert response.status_code == 200
        body = response.json()
        assert body["id"] == str(deployment.id)
        assert "secret" not in body

    async def test_detail_d_un_deploiement_d_autrui_renvoie_404(
        self, context: dict[str, object]
    ) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        other: User = context["other"]  # type: ignore[assignment]
        repository: FakeDeploymentRepository = context["repository"]  # type: ignore[assignment]
        deployment = make_deployment(owner_id=other.id)
        await repository.add(deployment)

        response = await http.get(f"/deployments/{deployment.id}", headers=_auth(user))

        assert response.status_code == 404

    async def test_detail_inconnu_renvoie_404(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]

        response = await http.get(f"/deployments/{uuid4()}", headers=_auth(user))

        assert response.status_code == 404


class TestLifecycleActions:
    async def test_stop_d_un_running_renvoie_202_et_enfile(
        self, context: dict[str, object]
    ) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        repository: FakeDeploymentRepository = context["repository"]  # type: ignore[assignment]
        queue: FakeJobQueue = context["queue"]  # type: ignore[assignment]
        deployment = make_deployment(owner_id=user.id, status=DeploymentStatus.RUNNING)
        await repository.add(deployment)

        response = await http.post(f"/deployments/{deployment.id}/stop", headers=_auth(user))

        assert response.status_code == 202
        assert queue.enqueued[-1].kind == JobKind.STOP

    async def test_start_d_un_stopped_renvoie_202(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        repository: FakeDeploymentRepository = context["repository"]  # type: ignore[assignment]
        deployment = make_deployment(owner_id=user.id, status=DeploymentStatus.STOPPED)
        await repository.add(deployment)

        response = await http.post(f"/deployments/{deployment.id}/start", headers=_auth(user))

        assert response.status_code == 202

    async def test_destroy_renvoie_202(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        repository: FakeDeploymentRepository = context["repository"]  # type: ignore[assignment]
        deployment = make_deployment(owner_id=user.id, status=DeploymentStatus.RUNNING)
        await repository.add(deployment)

        response = await http.post(f"/deployments/{deployment.id}/destroy", headers=_auth(user))

        assert response.status_code == 202

    async def test_regenerate_password_renvoie_202(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        repository: FakeDeploymentRepository = context["repository"]  # type: ignore[assignment]
        queue: FakeJobQueue = context["queue"]  # type: ignore[assignment]
        deployment = make_deployment(owner_id=user.id, status=DeploymentStatus.RUNNING)
        await repository.add(deployment)

        response = await http.post(
            f"/deployments/{deployment.id}/regenerate-password", headers=_auth(user)
        )

        assert response.status_code == 202
        assert queue.enqueued[-1].kind == JobKind.REGENERATE

    async def test_stop_transition_illegale_renvoie_409(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        repository: FakeDeploymentRepository = context["repository"]  # type: ignore[assignment]
        deployment = make_deployment(owner_id=user.id, status=DeploymentStatus.STOPPED)
        await repository.add(deployment)

        response = await http.post(f"/deployments/{deployment.id}/stop", headers=_auth(user))

        assert response.status_code == 409

    async def test_action_sur_deploiement_d_autrui_renvoie_404(
        self, context: dict[str, object]
    ) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        other: User = context["other"]  # type: ignore[assignment]
        repository: FakeDeploymentRepository = context["repository"]  # type: ignore[assignment]
        deployment = make_deployment(owner_id=other.id, status=DeploymentStatus.RUNNING)
        await repository.add(deployment)

        response = await http.post(f"/deployments/{deployment.id}/stop", headers=_auth(user))

        assert response.status_code == 404


class TestEventsStream:
    async def test_stream_renvoie_text_event_stream(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        repository: FakeDeploymentRepository = context["repository"]  # type: ignore[assignment]
        deployment = make_deployment(owner_id=user.id)
        await repository.add(deployment)

        async with http.stream(
            "GET", f"/deployments/{deployment.id}/events", headers=_auth(user)
        ) as response:
            assert response.status_code == 200
            assert response.headers["content-type"].startswith("text/event-stream")
            body = await response.aread()

        text = body.decode()
        assert DeploymentStatus.PROVISIONING.value in text
        assert DeploymentStatus.RUNNING.value in text
        # Le secret n'est diffuse QUE dans le flux SSE (jamais en REST).
        assert context["running_secret"] in text  # type: ignore[operator]

    async def test_stream_d_un_deploiement_d_autrui_renvoie_404(
        self, context: dict[str, object]
    ) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        other: User = context["other"]  # type: ignore[assignment]
        repository: FakeDeploymentRepository = context["repository"]  # type: ignore[assignment]
        deployment = make_deployment(owner_id=other.id)
        await repository.add(deployment)

        response = await http.get(f"/deployments/{deployment.id}/events", headers=_auth(user))

        assert response.status_code == 404

    async def test_stream_sans_jeton_renvoie_401(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]

        response = await http.get(f"/deployments/{uuid4()}/events")

        assert response.status_code in (401, 403)
