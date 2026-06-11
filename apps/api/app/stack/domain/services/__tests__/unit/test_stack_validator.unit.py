"""Tests unitaires du StackValidator : regles structurelles d'une composition.

Le validateur travaille sur les sous-commandes applicatives (`services` /
`links`, qui satisfont les protocoles structurels du domaine) avant toute
persistance : il garantit les invariants metier d'une stack composable (>= 1
service, alias non vides & uniques, liens vers des alias existants, pas
d'auto-lien, graphe des liens acyclique). Tout ecart leve `InvalidStackException`
(HTTP 422) ; une composition valide passe sans erreur.
"""

from uuid import uuid4

import pytest

from app.stack.application.commands.stack_link_command import StackLinkCommand
from app.stack.application.commands.stack_service_command import StackServiceCommand
from app.stack.domain.exceptions.invalid_stack import InvalidStackException
from app.stack.domain.services.stack_validator import StackValidator


def _service(alias: str, order_index: int = 0) -> StackServiceCommand:
    return StackServiceCommand(
        template_id=uuid4(),
        version="16",
        alias=alias,
        order_index=order_index,
    )


class TestServices:
    def test_composition_valide_passe_sans_erreur(self) -> None:
        StackValidator().validate(
            (_service("db", 0), _service("api", 1)),
            (StackLinkCommand(from_alias="api", to_alias="db"),),
        )

    def test_aucun_service_est_rejete(self) -> None:
        with pytest.raises(InvalidStackException):
            StackValidator().validate((), ())

    def test_alias_vide_est_rejete(self) -> None:
        with pytest.raises(InvalidStackException):
            StackValidator().validate((_service("db"), _service("   ")), ())

    def test_alias_duplique_est_rejete(self) -> None:
        with pytest.raises(InvalidStackException):
            StackValidator().validate((_service("db", 0), _service("db", 1)), ())


class TestLinks:
    def test_lien_vers_alias_inconnu_est_rejete(self) -> None:
        with pytest.raises(InvalidStackException):
            StackValidator().validate(
                (_service("api"),),
                (StackLinkCommand(from_alias="api", to_alias="fantome"),),
            )

    def test_lien_depuis_alias_inconnu_est_rejete(self) -> None:
        with pytest.raises(InvalidStackException):
            StackValidator().validate(
                (_service("db"),),
                (StackLinkCommand(from_alias="fantome", to_alias="db"),),
            )

    def test_auto_lien_est_rejete(self) -> None:
        with pytest.raises(InvalidStackException):
            StackValidator().validate(
                (_service("api"),),
                (StackLinkCommand(from_alias="api", to_alias="api"),),
            )


class TestCycles:
    def test_cycle_direct_a_b_a_est_rejete(self) -> None:
        with pytest.raises(InvalidStackException):
            StackValidator().validate(
                (_service("a", 0), _service("b", 1)),
                (
                    StackLinkCommand(from_alias="a", to_alias="b"),
                    StackLinkCommand(from_alias="b", to_alias="a"),
                ),
            )

    def test_cycle_indirect_a_b_c_a_est_rejete(self) -> None:
        with pytest.raises(InvalidStackException):
            StackValidator().validate(
                (_service("a", 0), _service("b", 1), _service("c", 2)),
                (
                    StackLinkCommand(from_alias="a", to_alias="b"),
                    StackLinkCommand(from_alias="b", to_alias="c"),
                    StackLinkCommand(from_alias="c", to_alias="a"),
                ),
            )

    def test_graphe_acyclique_en_losange_passe(self) -> None:
        # a -> b, a -> c, b -> d, c -> d : aucun cycle malgre deux chemins.
        StackValidator().validate(
            (_service("a", 0), _service("b", 1), _service("c", 2), _service("d", 3)),
            (
                StackLinkCommand(from_alias="a", to_alias="b"),
                StackLinkCommand(from_alias="a", to_alias="c"),
                StackLinkCommand(from_alias="b", to_alias="d"),
                StackLinkCommand(from_alias="c", to_alias="d"),
            ),
        )
