"""Test d'integration du SmtpEmailSender contre un serveur SMTP reel (MailHog).

Pattern : testcontainers demarre MailHog, on envoie un email via SMTP, puis
on interroge l'API HTTP de MailHog pour verifier que le message est bien
arrive avec le bon sujet, destinataire et multipart. Ce test couvre le
contrat reseau que les mocks unit ne peuvent pas garantir.
"""

import asyncio
import time
from collections.abc import Iterator

import httpx
import pytest
from testcontainers.core.container import DockerContainer

from app.core.email.domain.value_objects.email_message import EmailMessage
from app.core.email.infrastructure.smtp_email_sender import SmtpEmailSender


def _wait_for_port(container: DockerContainer, port: int, timeout: float = 30.0) -> int:
    """Polle `get_exposed_port` — Docker Desktop (Windows) peut publier le
    port quelques centaines de ms apres le demarrage du process."""
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            return int(container.get_exposed_port(port))
        except (ConnectionError, ValueError, TypeError):
            time.sleep(0.3)
    raise TimeoutError(f"Port {port} not exposed within {timeout}s")


@pytest.fixture(scope="module")
def mailhog_container() -> Iterator[DockerContainer]:
    container = DockerContainer("mailhog/mailhog:v1.0.1").with_exposed_ports(1025, 8025)
    container.start()
    try:
        _wait_for_port(container, 1025)
        _wait_for_port(container, 8025)
        yield container
    finally:
        container.stop()


class TestSmtpEmailSenderIntegration:
    async def test_envoie_un_email_recu_par_mailhog(
        self, mailhog_container: DockerContainer
    ) -> None:
        smtp_port = _wait_for_port(mailhog_container, 1025)
        api_port = _wait_for_port(mailhog_container, 8025)
        host = mailhog_container.get_container_host_ip()

        sender = SmtpEmailSender(
            host=host,
            port=smtp_port,
            username="",  # MailHog accepte sans auth
            password="",
            from_address="stacknest@test.local",
            use_starttls=False,  # MailHog ne supporte pas STARTTLS
        )
        message = EmailMessage(
            to="user@test.local",
            subject="Integration OK",
            body_html="<p>Contenu HTML</p>",
            body_text="Contenu texte",
        )

        await sender.send(message)

        # MailHog met quelques ms a indexer le message — on polle l'API HTTP
        async with httpx.AsyncClient(base_url=f"http://{host}:{api_port}") as client:
            for _ in range(20):
                response = await client.get("/api/v2/messages")
                payload = response.json()
                if payload["total"] >= 1:
                    break
                await asyncio.sleep(0.2)
            else:
                pytest.fail("MailHog n'a recu aucun message apres 4s")

        items = payload["items"]
        assert len(items) == 1
        received = items[0]
        assert received["Content"]["Headers"]["Subject"] == ["Integration OK"]
        assert received["Content"]["Headers"]["To"] == ["user@test.local"]
        assert received["Content"]["Headers"]["From"] == ["stacknest@test.local"]
