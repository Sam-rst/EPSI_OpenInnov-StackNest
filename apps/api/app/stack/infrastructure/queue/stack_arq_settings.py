"""Definitions partagees de la file arq de stack (file, fonction, settings).

Source de verite commune a l'enqueue (`ArqStackJobQueue`, cote API) et au consumer
worker (`worker_main`) : nom de la file, nom de la fonction worker enregistree, et
fabrique de `RedisSettings` depuis l'URL Redis configuree. Centraliser ici evite
toute divergence de chaine entre producteur et consommateur.

**Choix de file** : un worker `arq` consomme une seule file (`queue_name`). Au MVP,
le projet ne fait tourner **qu'un** service worker (image API partagee) ; les jobs
de stack et de deploiement transitent donc par la **meme** file
`stacknest:deployment`, et le worker enregistre les deux fonctions. arq route
ensuite chaque job vers la bonne fonction par son nom (`STACK_JOB_FUNCTION` vs
`DEPLOYMENT_JOB_FUNCTION`), ce qui garde les handlers totalement separes. Si la
charge le justifie plus tard, il suffira de demarrer un second worker dedie a une
file `stacknest:stack` propre, sans toucher au code metier.
"""

from arq.connections import RedisSettings

from app.deployment.infrastructure.queue.arq_settings import DEPLOYMENT_QUEUE_NAME

# File arq partagee avec le deploiement (un seul worker au MVP, cf. docstring).
STACK_QUEUE_NAME = DEPLOYMENT_QUEUE_NAME

# Nom de la fonction worker enregistree dans `WorkerSettings.functions`. Doit
# correspondre au premier argument de `enqueue_job` (cf. ArqStackJobQueue) et
# differer de la fonction de deploiement pour le routage arq.
STACK_JOB_FUNCTION = "process_stack_job"


def stack_redis_settings_from_url(url: str) -> RedisSettings:
    """Construit les `RedisSettings` arq a partir d'une URL Redis (`redis://...`)."""
    return RedisSettings.from_dsn(url)
