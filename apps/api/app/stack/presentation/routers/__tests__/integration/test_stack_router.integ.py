"""Tests d'integration du router de stack (httpx ASGI + fakes infra).

Monte l'application FastAPI complete (`create_app`) et remplace les providers
d'infrastructure du slice stack par des faux en memoire (depot, reader catalogue).
L'authentification utilise des jetons reels mintes par `JwtTokenService` ; le
depot d'utilisateurs est un faux. Aucune base reelle. Couvre : protection 401,
creation 201 (persistance, pas de provisioning au lot 2), liste, detail
(services + liens), suppression 204, isolation owner (liste + 404), validation
422 (alias duplique, cycle, lien orphelin) et masquage des params secret.
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
from app.main import create_app
from app.stack.application.__tests__.fakes import (
    FakeStackJobQueue,
    FakeStackRepository,
    FakeStackTemplateReader,
    docker_ref,
    terraform_ref,
)
from app.stack.domain.enums.stack_job_kind import StackJobKind
from app.stack.domain.value_objects.stack_template_ref import StackTemplateRef
from app.stack.presentation.dependencies.stack_providers import (
    get_stack_job_queue,
    get_stack_repository,
    get_stack_template_reader,
)

_SECRET = "secret-de-test-suffisamment-long-pour-hs256-32o"
_DB_TEMPLATE = UUID(int=11)
_API_TEMPLATE = UUID(int=22)


class _FakeUserRepository:
    def __init__(self, users: list[User]) -> None:
        self._by_id = {str(user.id): user for user in users}

    async def get_by_id(self, user_id: object) -> User | None:
        return self._by_id.get(str(user_id))


def _make_user() -> User:
    return User(
        id=uuid4(),
        email=Email(f"user-{uuid4().hex}@stacknest.local"),
        password_hash="$2b$12$hash",
        role=UserRole.USER,
        is_verified=True,
        token_version=0,
    )


def _auth(user: User) -> dict[str, str]:
    token = JwtTokenService(secret=_SECRET).issue(
        subject=user.id,
        purpose=TokenPurpose.ACCESS,
        role=user.role,
        token_version=user.token_version,
        ttl_seconds=900,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def context() -> AsyncIterator[dict[str, object]]:
    user = _make_user()
    other = _make_user()
    repository = FakeStackRepository()
    reader = FakeStackTemplateReader(
        {
            (_DB_TEMPLATE, "16"): docker_ref("PostgreSQL"),
            (_API_TEMPLATE, "1"): docker_ref("API"),
        }
    )

    queue = FakeStackJobQueue()

    app = create_app()
    app.dependency_overrides[get_token_service] = lambda: JwtTokenService(secret=_SECRET)
    app.dependency_overrides[get_user_repository] = lambda: _FakeUserRepository([user, other])
    app.dependency_overrides[get_stack_repository] = lambda: repository
    app.dependency_overrides[get_stack_template_reader] = lambda: reader
    app.dependency_overrides[get_stack_job_queue] = lambda: queue

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="https://test") as http:
        yield {
            "app": app,
            "http": http,
            "user": user,
            "other": other,
            "repository": repository,
            "queue": queue,
        }


def _create_body() -> dict[str, object]:
    return {
        "name": "ma-stack",
        "services": [
            {"template_id": str(_DB_TEMPLATE), "version": "16", "alias": "db", "order": 0},
            {"template_id": str(_API_TEMPLATE), "version": "1", "alias": "api", "order": 1},
        ],
        "links": [
            {
                "from_alias": "api",
                "to_alias": "db",
                "var_mappings": {"DB_HOST": "{to.alias}", "DB_PASSWORD": "{to.secret}"},
            }
        ],
    }


class TestProtection:
    async def test_liste_sans_jeton_renvoie_401(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]

        response = await http.get("/stacks")

        assert response.status_code in (401, 403)

    async def test_creation_sans_jeton_renvoie_401(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]

        response = await http.post("/stacks", json=_create_body())

        assert response.status_code in (401, 403)


class TestCreate:
    async def test_creation_renvoie_201_et_persiste(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        repository: FakeStackRepository = context["repository"]  # type: ignore[assignment]

        response = await http.post("/stacks", json=_create_body(), headers=_auth(user))

        assert response.status_code == 201, response.text
        body = response.json()
        assert body["name"] == "ma-stack"
        assert body["status"] == "pending"
        # Persistance : 1 stack, 2 services, 1 lien.
        assert len(repository.added_stacks) == 1
        assert len(repository.added_services) == 2
        assert len(repository.added_links) == 1

    async def test_creation_enfile_un_job_provision(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        queue: FakeStackJobQueue = context["queue"]  # type: ignore[assignment]

        response = await http.post("/stacks", json=_create_body(), headers=_auth(user))

        assert response.status_code == 201, response.text
        assert len(queue.enqueued) == 1
        assert queue.enqueued[0].kind is StackJobKind.PROVISION
        assert str(queue.enqueued[0].stack_id) == response.json()["id"]

    async def test_creation_alias_duplique_renvoie_422(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        repository: FakeStackRepository = context["repository"]  # type: ignore[assignment]
        body = {
            "name": "stack",
            "services": [
                {"template_id": str(_DB_TEMPLATE), "version": "16", "alias": "db", "order": 0},
                {"template_id": str(_DB_TEMPLATE), "version": "16", "alias": "db", "order": 1},
            ],
            "links": [],
        }

        response = await http.post("/stacks", json=body, headers=_auth(user))

        assert response.status_code == 422
        assert response.json()["error"] == "INVALID_STACK"
        assert repository.added_stacks == []

    async def test_creation_cycle_renvoie_422(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        repository: FakeStackRepository = context["repository"]  # type: ignore[assignment]
        body = {
            "name": "stack",
            "services": [
                {"template_id": str(_DB_TEMPLATE), "version": "16", "alias": "db", "order": 0},
                {"template_id": str(_API_TEMPLATE), "version": "1", "alias": "api", "order": 1},
            ],
            "links": [
                {"from_alias": "db", "to_alias": "api", "var_mappings": {}},
                {"from_alias": "api", "to_alias": "db", "var_mappings": {}},
            ],
        }

        response = await http.post("/stacks", json=body, headers=_auth(user))

        assert response.status_code == 422
        assert response.json()["error"] == "INVALID_STACK"
        assert repository.added_stacks == []

    async def test_creation_lien_orphelin_renvoie_422(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        repository: FakeStackRepository = context["repository"]  # type: ignore[assignment]
        body = {
            "name": "stack",
            "services": [
                {"template_id": str(_DB_TEMPLATE), "version": "16", "alias": "db", "order": 0},
            ],
            "links": [{"from_alias": "db", "to_alias": "fantome", "var_mappings": {}}],
        }

        response = await http.post("/stacks", json=body, headers=_auth(user))

        assert response.status_code == 422
        assert response.json()["error"] == "INVALID_STACK"
        assert repository.added_stacks == []

    async def test_creation_sans_service_renvoie_422(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]

        response = await http.post(
            "/stacks", json={"name": "stack", "services": [], "links": []}, headers=_auth(user)
        )

        # Le schema impose deja min_length=1 (422 Pydantic) avant le use case.
        assert response.status_code == 422

    async def test_creation_template_terraform_renvoie_422(
        self, context: dict[str, object]
    ) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        tf_template = UUID(int=99)
        reader = FakeStackTemplateReader({(tf_template, "1"): terraform_ref()})
        app = http._transport.app  # type: ignore[attr-defined]
        app.dependency_overrides[get_stack_template_reader] = lambda: reader
        body = {
            "name": "stack",
            "services": [
                {"template_id": str(tf_template), "version": "1", "alias": "vm", "order": 0}
            ],
            "links": [],
        }

        response = await http.post("/stacks", json=body, headers=_auth(user))

        assert response.status_code == 422
        assert response.json()["error"] == "INVALID_STACK"


class TestListAndGet:
    async def test_liste_n_renvoie_que_les_stacks_de_l_owner(
        self, context: dict[str, object]
    ) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        other: User = context["other"]  # type: ignore[assignment]

        await http.post("/stacks", json=_create_body(), headers=_auth(user))
        await http.post(
            "/stacks",
            json={**_create_body(), "name": "pas-a-moi"},
            headers=_auth(other),
        )

        response = await http.get("/stacks", headers=_auth(user))

        assert response.status_code == 200
        names = [item["name"] for item in response.json()]
        assert names == ["ma-stack"]

    async def test_detail_compose_services_et_liens(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        created = await http.post("/stacks", json=_create_body(), headers=_auth(user))
        stack_id = created.json()["id"]

        response = await http.get(f"/stacks/{stack_id}", headers=_auth(user))

        assert response.status_code == 200, response.text
        body = response.json()
        assert [s["alias"] for s in body["services"]] == ["db", "api"]
        assert len(body["links"]) == 1
        # Les var_mappings (expressions) sont exposees ; pas de secret resolu.
        assert body["links"][0]["var_mappings"]["DB_HOST"] == "{to.alias}"

    async def test_detail_d_une_stack_d_autrui_renvoie_404(
        self, context: dict[str, object]
    ) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        other: User = context["other"]  # type: ignore[assignment]
        created = await http.post("/stacks", json=_create_body(), headers=_auth(other))
        stack_id = created.json()["id"]

        response = await http.get(f"/stacks/{stack_id}", headers=_auth(user))

        assert response.status_code == 404
        assert response.json()["error"] == "STACK_NOT_FOUND"

    async def test_detail_inconnu_renvoie_404(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]

        response = await http.get(f"/stacks/{uuid4()}", headers=_auth(user))

        assert response.status_code == 404


class TestSecretMasking:
    async def test_detail_masque_les_params_secret(self, context: dict[str, object]) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        # Le template db declare un param secret `api_key`.
        from app.catalog.domain.enums.engine_kind import EngineKind

        reader = FakeStackTemplateReader(
            {
                (_DB_TEMPLATE, "16"): StackTemplateRef(
                    template_name="PostgreSQL",
                    engine=EngineKind.DOCKER,
                    secret_param_keys=frozenset({"api_key"}),
                ),
            }
        )
        app = http._transport.app  # type: ignore[attr-defined]
        app.dependency_overrides[get_stack_template_reader] = lambda: reader
        body = {
            "name": "stack",
            "services": [
                {
                    "template_id": str(_DB_TEMPLATE),
                    "version": "16",
                    "alias": "db",
                    "order": 0,
                    "params": {"db_name": "app", "api_key": "valeur-sensible-xyz"},
                }
            ],
            "links": [],
        }
        created = await http.post("/stacks", json=body, headers=_auth(user))
        stack_id = created.json()["id"]

        response = await http.get(f"/stacks/{stack_id}", headers=_auth(user))

        assert response.status_code == 200, response.text
        service = response.json()["services"][0]
        assert service["params"]["db_name"] == "app"
        assert service["params"]["api_key"] != "valeur-sensible-xyz"
        assert "valeur-sensible-xyz" not in response.text


class TestDelete:
    async def test_suppression_renvoie_204_et_enfile_un_job_destroy(
        self, context: dict[str, object]
    ) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        queue: FakeStackJobQueue = context["queue"]  # type: ignore[assignment]
        created = await http.post("/stacks", json=_create_body(), headers=_auth(user))
        stack_id = created.json()["id"]
        queue.enqueued.clear()  # on isole le job de destruction du job de creation

        response = await http.delete(f"/stacks/{stack_id}", headers=_auth(user))

        assert response.status_code == 204
        # La destruction est asynchrone : un job DESTROY est enfile pour la stack.
        assert len(queue.enqueued) == 1
        assert queue.enqueued[0].kind is StackJobKind.DESTROY
        assert str(queue.enqueued[0].stack_id) == stack_id

    async def test_suppression_d_une_stack_d_autrui_renvoie_404_sans_enfiler(
        self, context: dict[str, object]
    ) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        other: User = context["other"]  # type: ignore[assignment]
        queue: FakeStackJobQueue = context["queue"]  # type: ignore[assignment]
        created = await http.post("/stacks", json=_create_body(), headers=_auth(other))
        stack_id = created.json()["id"]
        queue.enqueued.clear()

        response = await http.delete(f"/stacks/{stack_id}", headers=_auth(user))

        assert response.status_code == 404
        assert queue.enqueued == []


class TestEvents:
    async def test_flux_evenements_d_une_stack_inexistante_renvoie_404(
        self, context: dict[str, object]
    ) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]

        response = await http.get(f"/stacks/{uuid4()}/events", headers=_auth(user))

        assert response.status_code == 404

    async def test_flux_evenements_d_une_stack_d_autrui_renvoie_404(
        self, context: dict[str, object]
    ) -> None:
        http: httpx.AsyncClient = context["http"]  # type: ignore[assignment]
        user: User = context["user"]  # type: ignore[assignment]
        other: User = context["other"]  # type: ignore[assignment]
        created = await http.post("/stacks", json=_create_body(), headers=_auth(other))
        stack_id = created.json()["id"]

        response = await http.get(f"/stacks/{stack_id}/events", headers=_auth(user))

        assert response.status_code == 404
