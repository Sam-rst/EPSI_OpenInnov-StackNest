"""Tests unitaires de l'entrypoint worker arq (WorkerSettings + fonction)."""

from app.deployment.infrastructure.queue.arq_settings import (
    DEPLOYMENT_JOB_FUNCTION,
    DEPLOYMENT_QUEUE_NAME,
)
from app.worker_main import WorkerSettings, process_deployment_job


class TestWorkerSettings:
    def test_consomme_la_file_dediee_au_deploiement(self) -> None:
        assert WorkerSettings.queue_name == DEPLOYMENT_QUEUE_NAME

    def test_enregistre_la_fonction_de_traitement(self) -> None:
        assert process_deployment_job in WorkerSettings.functions

    def test_le_nom_de_la_fonction_correspond_a_l_enqueue(self) -> None:
        # arq enqueue par nom : la fonction doit porter le nom attendu cote producteur.
        assert process_deployment_job.__name__ == DEPLOYMENT_JOB_FUNCTION

    def test_expose_les_hooks_de_cycle_de_vie(self) -> None:
        assert callable(WorkerSettings.on_startup)
        assert callable(WorkerSettings.on_shutdown)

    def test_redis_settings_present(self) -> None:
        assert WorkerSettings.redis_settings is not None
