"""Tests unitaires de l'entite de domaine `StackService` (guard clauses)."""

from uuid import uuid4

import pytest

from app.stack.domain.entities.stack_service import StackService
from app.stack.domain.enums.service_status import ServiceStatus


def _service(
    *,
    alias: str = "db",
    version: str = "16",
    published_port: int | None = None,
) -> StackService:
    return StackService(
        id=uuid4(),
        stack_id=uuid4(),
        template_id=uuid4(),
        version=version,
        alias=alias,
        service_status=ServiceStatus.PENDING,
        order_index=0,
        published_port=published_port,
    )


class TestGuardClauses:
    def test_construit_un_service_valide(self) -> None:
        service = _service(published_port=5432)

        assert service.alias == "db"
        assert service.version == "16"
        assert service.published_port == 5432
        assert service.params == {}
        assert service.container_ref is None

    def test_refuse_un_alias_vide(self) -> None:
        with pytest.raises(ValueError, match="alias ne doit pas etre vide"):
            _service(alias="  ")

    def test_refuse_une_version_vide(self) -> None:
        with pytest.raises(ValueError, match="version ne doit pas etre vide"):
            _service(version="")

    @pytest.mark.parametrize("port", [0, -1, 65536, 70000])
    def test_refuse_un_port_hors_plage(self, port: int) -> None:
        with pytest.raises(ValueError, match="published_port doit etre dans"):
            _service(published_port=port)

    @pytest.mark.parametrize("port", [1, 5432, 65535])
    def test_accepte_un_port_dans_la_plage(self, port: int) -> None:
        assert _service(published_port=port).published_port == port

    def test_accepte_un_port_none(self) -> None:
        assert _service(published_port=None).published_port is None
