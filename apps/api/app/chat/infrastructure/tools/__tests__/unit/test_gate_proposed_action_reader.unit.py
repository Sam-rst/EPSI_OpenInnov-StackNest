"""Tests unitaires du GateProposedActionReader (reconstruction du recap rejouable).

Au rechargement d'un fil, le reader recharge les `ChatAction` encore `proposed`
et reconstruit leur `recap` PUBLIC en rejouant la gate sur leurs `args` valides
deja persistes (memes regles de masquage : aucun secret). Une proposition dont
l'entite referencee a disparu (template supprime, deploiement efface) est
silencieusement ecartee — on ne rejoue pas une carte orpheline.
"""

from uuid import uuid4

from app.chat.application.__tests__.fakes import (
    FakeCatalogReader,
    FakeChatActionRepository,
    make_param,
    make_template,
)
from app.chat.domain.entities.chat_action import ChatAction
from app.chat.domain.enums.action_kind import ActionKind
from app.chat.domain.enums.action_status import ActionStatus
from app.chat.infrastructure.tools.action_args_gate import ActionArgsGate
from app.chat.infrastructure.tools.gate_proposed_action_reader import (
    GateProposedActionReader,
)
from app.deployment.application.__tests__.fakes import FakeDeploymentRepository
from app.deployment.domain.entities.deployment import Deployment
from app.deployment.domain.enums.deployment_status import DeploymentStatus


class TestDeployRecapRebuild:
    async def test_reconstruit_le_recap_public_du_deploiement(self) -> None:
        owner = uuid4()
        template = make_template(versions=["16"], params=[make_param(key="db_name")])
        catalog = FakeCatalogReader([template])
        deployments = FakeDeploymentRepository()
        gate = ActionArgsGate(catalog=catalog, deployments=deployments)
        conversation_id = uuid4()
        message_id = uuid4()
        actions = FakeChatActionRepository(
            [
                ChatAction(
                    id=uuid4(),
                    conversation_id=conversation_id,
                    message_id=message_id,
                    kind=ActionKind.DEPLOY,
                    status=ActionStatus.PROPOSED,
                    args={
                        "template_id": str(template.id),
                        "version": "16",
                        "name": "db",
                        "params": {"db_name": "app"},
                    },
                )
            ]
        )
        reader = GateProposedActionReader(actions=actions, gate=gate, owner_id=owner)

        proposals = await reader.list_proposed(conversation_id)

        assert len(proposals) == 1
        proposal = proposals[0]
        assert proposal.message_id == message_id
        assert proposal.kind is ActionKind.DEPLOY
        # Recap IDENTIQUE a celui que l'event SSE exposait (template = NOM, pas l'id).
        assert proposal.recap == {
            "template": "PostgreSQL",
            "version": "16",
            "name": "db",
            "params": {"db_name": "app"},
        }
        # Aucun id technique de template ne fuite dans le recap public.
        assert str(template.id) not in str(proposal.recap)


class TestLifecycleRecapRebuild:
    async def test_reconstruit_le_recap_du_cycle_de_vie(self) -> None:
        owner = uuid4()
        deployment = Deployment(
            id=uuid4(),
            owner_id=owner,
            template_id=uuid4(),
            template_version="16",
            name="ma-base",
            status=DeploymentStatus.RUNNING,
        )
        deployments = FakeDeploymentRepository([deployment])
        gate = ActionArgsGate(catalog=FakeCatalogReader([]), deployments=deployments)
        conversation_id = uuid4()
        message_id = uuid4()
        actions = FakeChatActionRepository(
            [
                ChatAction(
                    id=uuid4(),
                    conversation_id=conversation_id,
                    message_id=message_id,
                    kind=ActionKind.STOP,
                    status=ActionStatus.PROPOSED,
                    args={"deployment_id": str(deployment.id)},
                )
            ]
        )
        reader = GateProposedActionReader(actions=actions, gate=gate, owner_id=owner)

        proposals = await reader.list_proposed(conversation_id)

        assert len(proposals) == 1
        assert proposals[0].kind is ActionKind.STOP
        assert proposals[0].recap == {"deployment": "ma-base", "status": "running"}


class TestStaleProposalDropped:
    async def test_ecarte_une_proposition_dont_le_template_a_disparu(self) -> None:
        owner = uuid4()
        # Catalogue vide : le template reference n'existe plus.
        gate = ActionArgsGate(catalog=FakeCatalogReader([]), deployments=FakeDeploymentRepository())
        conversation_id = uuid4()
        actions = FakeChatActionRepository(
            [
                ChatAction(
                    id=uuid4(),
                    conversation_id=conversation_id,
                    message_id=uuid4(),
                    kind=ActionKind.DEPLOY,
                    status=ActionStatus.PROPOSED,
                    args={"template_id": str(uuid4()), "version": "16", "name": "x", "params": {}},
                )
            ]
        )
        reader = GateProposedActionReader(actions=actions, gate=gate, owner_id=owner)

        proposals = await reader.list_proposed(conversation_id)

        assert proposals == []
