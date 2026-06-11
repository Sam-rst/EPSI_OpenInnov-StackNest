"""Runner de sous-process pour la CLI docker compose (asyncio).

Abstrait l'execution d'une commande externe derriere un `Protocol`, ce qui rend
le `ComposeCliProvisioner` testable sans demon Docker (runner fake en memoire).
L'implementation reelle deporte l'I/O dans `asyncio.create_subprocess_exec` pour
ne pas bloquer la boucle d'evenements du worker async.
"""

import asyncio
from typing import Protocol

from app.stack.infrastructure.provisioner.command_result import CommandResult

_ENCODING = "utf-8"


class CommandRunner(Protocol):
    """Contrat d'execution d'une commande externe (injecte dans le provisioner)."""

    async def __call__(self, args: list[str], *, stdin: str | None = None) -> CommandResult:
        """Execute `args`, alimente `stdin` si fourni, renvoie le `CommandResult`."""
        ...


async def run_subprocess(args: list[str], *, stdin: str | None = None) -> CommandResult:
    """Runner reel : execute la commande via `asyncio.create_subprocess_exec`.

    `stdin` est encode et transmis au processus (utilise pour passer le compose-
    file via `-f -`). La sortie est decodee en UTF-8 (erreurs remplacees).
    """
    process = await asyncio.create_subprocess_exec(
        *args,
        stdin=asyncio.subprocess.PIPE if stdin is not None else None,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    payload = stdin.encode(_ENCODING) if stdin is not None else None
    stdout_bytes, stderr_bytes = await process.communicate(input=payload)
    return CommandResult(
        returncode=process.returncode if process.returncode is not None else -1,
        stdout=stdout_bytes.decode(_ENCODING, errors="replace"),
        stderr=stderr_bytes.decode(_ENCODING, errors="replace"),
    )
