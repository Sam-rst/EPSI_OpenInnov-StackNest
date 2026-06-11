"""Value object CommandResult : resultat d'un sous-process docker compose."""

from dataclasses import dataclass


@dataclass(frozen=True)
class CommandResult:
    """Sortie d'une commande externe (`docker compose ...`) executee par le runner.

    Immutable. Decouple le `ComposeCliProvisioner` du detail d'execution du
    sous-process : le runner reel (`asyncio.create_subprocess_exec`) et le runner
    fake des tests renvoient tous deux ce VO.

    - `returncode` : code de sortie du processus (0 = succes).
    - `stdout`     : sortie standard decodee (ex. NDJSON de `compose ps`).
    - `stderr`     : sortie d'erreur decodee (cause d'echec).
    """

    returncode: int
    stdout: str
    stderr: str

    def is_success(self) -> bool:
        """Vrai si la commande s'est terminee avec succes (code 0)."""
        return self.returncode == 0
