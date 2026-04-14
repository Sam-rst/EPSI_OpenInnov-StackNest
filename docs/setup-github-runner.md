# Installation du Self-Hosted GitHub Actions Runner

## Contexte

Ce runner permet à la pipeline CI/CD GitHub Actions de déployer automatiquement StackNest sur le serveur. Aucun port entrant n'est nécessaire — le runner initie une connexion sortante vers GitHub en HTTPS.

## Prérequis

- Docker et Docker Compose installés sur la VM
- Accès admin au repo GitHub : https://github.com/Sam-rst/EPSI_OpenInnov-StackNest

## Étape 1 — Récupérer le token runner sur GitHub

1. Aller sur le repo : **Settings → Actions → Runners → New self-hosted runner**
2. Choisir **Linux** et **x64**
3. Copier le **token** affiché (il expire rapidement, ne pas traîner)

## Étape 2 — Créer le dossier et le fichier Compose

```bash
mkdir -p /opt/github-runner && cd /opt/github-runner
```

Créer le fichier `docker-compose.runner.yml` :

```yaml
services:
  github-runner:
    image: myoung34/docker-github-actions-runner:latest
    container_name: github-runner
    restart: unless-stopped
    environment:
      - REPO_URL=https://github.com/Sam-rst/EPSI_OpenInnov-StackNest
      - RUNNER_TOKEN=<COLLER_LE_TOKEN_ICI>
      - RUNNER_NAME=stacknest-runner
      - RUNNER_LABELS=self-hosted,stacknest
      - RUNNER_WORKDIR=/tmp/runner/work
      - DOCKER_ENABLED=true
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - runner-work:/tmp/runner/work
    security_opt:
      - label:disable

volumes:
  runner-work:
```

Remplacer `<COLLER_LE_TOKEN_ICI>` par le token copié à l'étape 1.

## Étape 3 — Lancer le runner

```bash
docker compose -f docker-compose.runner.yml up -d
```

## Étape 4 — Vérifier

Retourner sur GitHub : **Settings → Actions → Runners**.
Le runner `stacknest-runner` doit apparaître en vert avec le statut **Idle**.

Pour vérifier les logs si besoin :

```bash
docker logs -f github-runner
```

## Points de sécurité

- **Docker socket monté** : le runner a accès au Docker socket pour pouvoir lancer `docker compose up` lors des déploiements. C'est un accès privilégié — ne pas exposer le runner à des workflows de repos tiers.
- **Token éphémère** : le token de l'étape 1 sert uniquement à l'enregistrement initial. Ensuite le runner s'authentifie automatiquement.
- **Aucun port entrant** : le runner fait du long-polling HTTPS sortant vers GitHub. Rien à ouvrir dans le firewall.
- **Restriction workflows** : dans le repo GitHub, aller dans **Settings → Actions → General** et cocher "Require approval for all outside collaborators".

## En cas de problème

| Symptôme | Solution |
|---|---|
| Runner n'apparaît pas sur GitHub | Vérifier le token (il expire vite). Recréer un nouveau token et relancer le container. |
| Runner en "Offline" | `docker logs github-runner` pour voir l'erreur. Souvent un problème réseau sortant. |
| Erreur "permission denied" sur docker.sock | Vérifier que le socket est bien monté et que les permissions sont correctes : `ls -la /var/run/docker.sock` |
