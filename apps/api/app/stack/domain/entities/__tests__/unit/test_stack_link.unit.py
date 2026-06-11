"""Tests unitaires de l'entite de domaine `StackLink` (guard clauses)."""

from uuid import uuid4

import pytest

from app.stack.domain.entities.stack_link import StackLink


class TestGuardClauses:
    def test_construit_un_lien_valide(self) -> None:
        from_id, to_id = uuid4(), uuid4()

        link = StackLink(
            id=uuid4(),
            stack_id=uuid4(),
            from_service_id=from_id,
            to_service_id=to_id,
            var_mappings={"DB_HOST": "{to.alias}"},
        )

        assert link.from_service_id == from_id
        assert link.to_service_id == to_id
        assert link.var_mappings == {"DB_HOST": "{to.alias}"}

    def test_var_mappings_par_defaut_vide(self) -> None:
        link = StackLink(
            id=uuid4(),
            stack_id=uuid4(),
            from_service_id=uuid4(),
            to_service_id=uuid4(),
        )

        assert link.var_mappings == {}

    def test_refuse_un_lien_vers_soi_meme(self) -> None:
        service_id = uuid4()

        with pytest.raises(ValueError, match="doivent differer"):
            StackLink(
                id=uuid4(),
                stack_id=uuid4(),
                from_service_id=service_id,
                to_service_id=service_id,
            )
