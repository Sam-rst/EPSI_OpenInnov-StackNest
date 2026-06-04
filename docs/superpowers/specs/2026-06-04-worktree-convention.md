# Convention worktree multi-agents — Spec technique (STN-156)

> Permettre à plusieurs agents IA et développeurs de travailler **en parallèle** sur le
> même dépôt, chacun dans un git worktree isolé doté de **sa propre stack Docker** (nom de
> projet Compose unique + jeu de ports dédié), sans collision de ports ni d'état.
>
> Ticket : [STN-156](https://samrst-studies.atlassian.net/browse/STN-156) — Tâche DevOps, 3 SP.
> Lié (Relates) à STN-157 (intégration mockup) qui bénéficiera du workflow parallèle.

---

## 1. Problème

Aujourd'hui, lancer deux environnements `docker compose up` en parallèle provoque :

- **Collision de ports hôte** : `5432`, `6379`, `8000`, `8080`, `11434`, `1025`, `8025` sont
  fixes — le second `up` échoue (`port is already allocated`).
- **Collision de nom de projet Compose** : `name: stacknest` (codé en dur) fait que les deux
  stacks partagent conteneurs, réseaux et volumes — l'une écrase l'autre.

Conséquence : un seul agent/dev peut faire tourner la stack à la fois. Le travail multi-agents
parallèle (objectif de l'équipe) est bloqué côté runtime.

---

## 2. Décisions de design (validées)

| Sujet | Décision | Justification |
| --- | --- | --- |
| Espace de travail | Git **worktrees** dans `.worktrees/` (gitignored) | Isolation filesystem + branche, sans re-cloner |
| Registre de slots | `.worktrees/registry.json` | État runtime par clone, source de vérité des slots occupés |
| Allocation de ports | `port = base + slot×100` sur 7 services | Écart de 100 → aucun chevauchement entre slots adjacents |
| Slot principal | **Slot 0 = dépôt principal** (ports par défaut) | Le dépôt racine garde le comportement historique, sans `.env` de worktree |
| Isolation Docker | `name: ${COMPOSE_PROJECT_NAME:-stacknest}` | Une seule ligne modifiée ; rétro-compatible (défaut = `stacknest`) |
| Outillage | Script bash `scripts/worktree.sh` (`new` / `list` / `rm` / `ports`) | Cohérent avec les scripts infra existants (`scripts/cyber/`, `tests/infra/*.sh`) |
| Manipulation JSON | `python3`/`python` (dépendance projet déjà requise) | Évite d'imposer `jq` ; même pattern que `tests/infra/*.sh` |
| Portabilité | Bash via WSL/Git Bash | Cohérent avec le reste de l'outillage ; Windows natif hors scope |

### Note d'écart vs DOR

Le DOR mentionne `infra/docker/docker-compose.yml`. Le fichier réel est à la **racine du dépôt**
(`docker-compose.yml`, qui contient déjà `name: stacknest` ligne 5). La spec s'aligne sur la
réalité : la modification porte sur `./docker-compose.yml`.

---

## 3. Allocation des slots et des ports

7 ports variabilisés (déjà présents dans `docker-compose.yml` / `.dev.yml` / `.env.example`) :

| Variable | Base (slot 0) | Slot 1 | Slot 2 | Formule |
| --- | --- | --- | --- | --- |
| `POSTGRES_PORT` | 5432 | 5532 | 5632 | `5432 + slot×100` |
| `REDIS_PORT` | 6379 | 6479 | 6579 | `6379 + slot×100` |
| `API_PORT` | 8000 | 8100 | 8200 | `8000 + slot×100` |
| `UI_PORT` | 8080 | 8180 | 8280 | `8080 + slot×100` |
| `MAILHOG_SMTP_PORT` | 1025 | 1125 | 1225 | `1025 + slot×100` |
| `MAILHOG_UI_PORT` | 8025 | 8125 | 8225 | `8025 + slot×100` |
| `OLLAMA_PORT` | 11434 | 11534 | 11634 | `11434 + slot×100` |

- **Slot 0** est réservé au dépôt principal (jamais inscrit dans le registre).
- Les worktrees prennent les slots **1 à `MAX_SLOTS` (9)** → bornes de ports saines.
- `COMPOSE_PROJECT_NAME` :
  - slot 0 → `stacknest` (défaut Compose) ;
  - slot N → `stacknest-wt<N>` (ex. `stacknest-wt1`).

---

## 4. Registre `.worktrees/registry.json`

Bootstrappé au premier `new` si absent. Gitignored (jamais committé). Structure :

```json
{
  "version": 1,
  "slots": {
    "1": {
      "branch": "feature/STN-157-integration-mockup-ref",
      "path": ".worktrees/feature-STN-157-integration-mockup-ref",
      "project": "stacknest-wt1",
      "created_at": "2026-06-04T10:30:00Z"
    }
  }
}
```

`slots` est indexé par numéro de slot (chaîne). Slot 0 absent par convention.

---

## 5. Interface CLI `scripts/worktree.sh`

| Commande | Effet |
| --- | --- |
| `new <branche>` | Alloue le 1er slot libre, crée le worktree `.worktrees/<slug>` depuis `main` sur une nouvelle branche, génère `.env` (`COMPOSE_PROJECT_NAME` + 7 ports), lance `npm install` + `uv sync` (sauf `WORKTREE_SKIP_INSTALL=1`) |
| `list` | Affiche slot / branche / chemin / `COMPOSE_PROJECT_NAME` pour chaque worktree enregistré |
| `rm <branche>` | Supprime le worktree (`git worktree remove`), libère le slot dans le registre, propose `docker compose down -v` (ne supprime PAS la branche — geste destructif laissé au dev) |
| `ports <branche-ou-slot>` | Affiche les 7 ports : si l'argument est un numéro → calcul direct ; sinon résolution branche→slot via le registre |

- `<slug>` = branche avec `/` remplacé par `-` (ex. `feature/STN-157-x` → `feature-STN-157-x`).
- `ROOT` résolu via `git rev-parse --git-common-dir` → opère toujours sur le `.worktrees/` du
  dépôt **principal**, même si le script est invoqué depuis un worktree.

### Garde-fous (parcours alternatifs)

- **Aucun slot libre** (`MAX_SLOTS` atteint) → erreur explicite + suggestion de `rm`.
- **Branche/worktree déjà enregistré** → refus.
- **`.worktrees/` non ignoré par git** (`git check-ignore`) → avertissement anti-commit accidentel.
- **`rm` d'un worktree avec stack up** → message proposant `docker compose down -v` d'abord.

---

## 6. Livrables

| Livrable | Détail |
| --- | --- |
| `scripts/worktree.sh` | Script exécutable, sous-commandes `new`/`list`/`rm`/`ports` |
| `docker-compose.yml` | 1 ligne : `name: ${COMPOSE_PROJECT_NAME:-stacknest}` |
| `.gitignore` | Ajout de `.worktrees/` |
| `.env.example` | Section worktree : `COMPOSE_PROJECT_NAME` + rappel formule ports |
| `tests/infra/test_worktree.sh` | Test d'intégration multi-scénarios (CA1/CA4/CA5 + structurels) |
| `CLAUDE.md` | Section « Workflow worktree multi-agents » |
| `.claude/skills/worktree/SKILL.md` | Skill d'onboarding (workflow parallèle) |

---

## 7. Stratégie de test (`tests/infra/test_worktree.sh`)

Aligné sur les conventions des autres tests infra (`set -euo pipefail`, `red/green`, accumulateur
`FAIL`, sorties `[OK]`/`[FAIL]` par CA). Exécute le vrai `git worktree add` (rapide) mais saute
`npm install`/`uv sync` via `WORKTREE_SKIP_INSTALL=1`.

| Vérification | CA |
| --- | --- |
| Script présent + exécutable | structurel |
| `docker-compose.yml` contient `name: ${COMPOSE_PROJECT_NAME:-stacknest}` | CA2 |
| `.worktrees/` ignoré (`git check-ignore`) | CA1 (garde-fou) |
| `.env.example` documente `COMPOSE_PROJECT_NAME` + 7 ports | structurel |
| `ports 0` → ports par défaut ; `ports 1`/`ports 2` → `+100`/`+200` ; unicité inter-slots | CA5 / CA3 |
| `new` → worktree + `.env` (7 ports + `COMPOSE_PROJECT_NAME`) + slot dans le registre | CA1 |
| `list` affiche le worktree créé | CA4 |
| `ports <branche>` résout via le registre | CA5 |
| `rm` supprime le worktree + libère le slot | CA4 |
| `new` rejeté si branche déjà enregistrée | parcours alt. |

Hors scope test automatique (validation manuelle) : deux stacks Docker simultanées sans collision
(CA2 runtime), slot 0 = ports par défaut sur la vraie stack.

---

## 8. Hors périmètre

- Orchestration multi-machines / CI distribuée.
- Gestion de worktrees distants.
- Nettoyage automatique des volumes Docker orphelins (manuel pour le MVP).
- Windows natif hors WSL/Git Bash.
- Aucune modification applicative (`api`/`web`/`worker`) ni schéma BDD.
