"""Definitions partagees de la file arq de deploiement (file, fonction, settings).

Source de verite commune a l'enqueue (`ArqJobQueue`, cote API) et au consumer
worker (cable dans une slice ulterieure) : nom de la file dediee, nom de la
fonction worker enregistree, et fabrique de `RedisSettings` depuis l'URL Redis
configuree (`Settings.redis_url`). Centraliser ici evite toute divergence de
chaine entre producteur et consommateur.
"""

from arq.connections import RedisSettings

# File arq dediee au domaine deploiement (isole des autres usages Redis).
DEPLOYMENT_QUEUE_NAME = "stacknest:deployment"

# Nom de la fonction worker enregistree dans `WorkerSettings.functions`. Doit
# correspondre au premier argument de `enqueue_job` (cf. ArqJobQueue).
DEPLOYMENT_JOB_FUNCTION = "process_deployment_job"


def redis_settings_from_url(url: str) -> RedisSettings:
    """Construit les `RedisSettings` arq a partir d'une URL Redis (`redis://...`)."""
    return RedisSettings.from_dsn(url)
