"""Tests unitaires des definitions arq (nom de file, fonction worker, settings)."""

from arq.connections import RedisSettings

from app.deployment.infrastructure.queue.arq_settings import (
    DEPLOYMENT_JOB_FUNCTION,
    DEPLOYMENT_QUEUE_NAME,
    redis_settings_from_url,
)


class TestArqConstants:
    def test_nom_de_file_dedie_au_deploiement(self) -> None:
        assert DEPLOYMENT_QUEUE_NAME == "stacknest:deployment"

    def test_nom_de_fonction_worker_stable(self) -> None:
        assert DEPLOYMENT_JOB_FUNCTION == "process_deployment_job"


class TestRedisSettingsFromUrl:
    def test_construit_des_redis_settings_arq(self) -> None:
        settings = redis_settings_from_url("redis://localhost:6379/0")

        assert isinstance(settings, RedisSettings)
        assert settings.host == "localhost"
        assert settings.port == 6379

    def test_prend_en_compte_l_hote_et_la_base(self) -> None:
        settings = redis_settings_from_url("redis://cache:6380/3")

        assert settings.host == "cache"
        assert settings.port == 6380
        assert settings.database == 3
