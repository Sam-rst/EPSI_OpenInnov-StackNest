"""Tests unitaires de la construction du DockerSdkProvisioner depuis la config.

La fabrique `from_docker_host` traduit le champ `docker_host` de la config en un
client docker-py et en un `host` lisible pour le `ProvisionResult` :

- `docker_host` vide  -> demon local (docker-py `from_env`), host = "localhost" ;
- `docker_host=ssh://deployer@B` -> `DockerClient(base_url=...)`, host = "B" ;
- `docker_host=tcp://1.2.3.4:2375` -> `DockerClient(base_url=...)`, host = "1.2.3.4".
"""

from unittest.mock import MagicMock, patch

from app.deployment.infrastructure.provisioner.docker_sdk_provisioner import (
    DockerSdkProvisioner,
)


class TestFromDockerHost:
    def test_vide_utilise_le_demon_local(self) -> None:
        with patch(
            "app.deployment.infrastructure.provisioner.docker_sdk_provisioner.docker"
        ) as docker_mod:
            docker_mod.from_env.return_value = MagicMock()

            provisioner = DockerSdkProvisioner.from_docker_host("")

            docker_mod.from_env.assert_called_once_with()
            docker_mod.DockerClient.assert_not_called()
            assert provisioner.host == "localhost"

    def test_ssh_construit_un_client_distant_et_extrait_l_hote(self) -> None:
        with patch(
            "app.deployment.infrastructure.provisioner.docker_sdk_provisioner.docker"
        ) as docker_mod:
            docker_mod.DockerClient.return_value = MagicMock()

            provisioner = DockerSdkProvisioner.from_docker_host("ssh://deployer@execB")

            docker_mod.DockerClient.assert_called_once_with(base_url="ssh://deployer@execB")
            docker_mod.from_env.assert_not_called()
            assert provisioner.host == "execB"

    def test_tcp_extrait_l_hote(self) -> None:
        with patch(
            "app.deployment.infrastructure.provisioner.docker_sdk_provisioner.docker"
        ) as docker_mod:
            docker_mod.DockerClient.return_value = MagicMock()

            provisioner = DockerSdkProvisioner.from_docker_host("tcp://1.2.3.4:2375")

            docker_mod.DockerClient.assert_called_once_with(base_url="tcp://1.2.3.4:2375")
            assert provisioner.host == "1.2.3.4"
