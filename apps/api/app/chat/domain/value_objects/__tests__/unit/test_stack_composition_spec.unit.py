"""Tests unitaires des VO de composition de stack proposee par le chat.

`StackServiceSpec` / `StackLinkSpec` portent la composition VALIDEE (services +
liens) d'une proposition `compose_stack`, du moteur de chat vers le port
`StackActions`. Immutables, sans secret : seules les cles de params non secretes
y figurent (les params `secret` sont generes worker-side, jamais ici).
"""

from dataclasses import FrozenInstanceError
from uuid import uuid4

import pytest

from app.chat.domain.value_objects.stack_composition_spec import (
    StackLinkSpec,
    StackServiceSpec,
)


class TestStackServiceSpec:
    def test_porte_template_alias_version_et_params(self) -> None:
        template_id = uuid4()
        spec = StackServiceSpec(
            template_id=template_id,
            alias="db",
            version="16",
            params={"db_name": "app"},
        )

        assert spec.template_id == template_id
        assert spec.alias == "db"
        assert spec.version == "16"
        assert spec.params == {"db_name": "app"}

    def test_est_immutable(self) -> None:
        spec = StackServiceSpec(template_id=uuid4(), alias="db", version="16")

        with pytest.raises(FrozenInstanceError):
            spec.alias = "autre"  # type: ignore[misc]

    def test_params_par_defaut_vides(self) -> None:
        spec = StackServiceSpec(template_id=uuid4(), alias="db", version="16")

        assert spec.params == {}


class TestStackLinkSpec:
    def test_porte_les_deux_alias_et_le_mapping(self) -> None:
        link = StackLinkSpec(
            from_alias="api",
            to_alias="db",
            var_mappings={"DATABASE_HOST": "{to.alias}"},
        )

        assert link.from_alias == "api"
        assert link.to_alias == "db"
        assert link.var_mappings == {"DATABASE_HOST": "{to.alias}"}

    def test_est_immutable(self) -> None:
        link = StackLinkSpec(from_alias="api", to_alias="db")

        with pytest.raises(FrozenInstanceError):
            link.to_alias = "autre"  # type: ignore[misc]

    def test_mappings_par_defaut_vides(self) -> None:
        link = StackLinkSpec(from_alias="api", to_alias="db")

        assert link.var_mappings == {}
