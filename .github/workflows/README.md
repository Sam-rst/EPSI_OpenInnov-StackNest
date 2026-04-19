# GitHub Actions — CI/CD StackNest

Ce dossier contient les workflows GitHub Actions du projet. Deux workflows :

| Fichier | Déclencheur | Cible wall-time | Rôle |
|---|---|---|---|
| [`ci.yml`](ci.yml) | `push` / `pull_request main` | ~2-3 min | Feedback dev loop rapide. **Seul required check** sur la branch protection via le job `ci-ok`. |
| [`ci-nightly.yml`](ci-nightly.yml) | `schedule cron "0 20 * * *"` + `workflow_dispatch` | ~15-30 min | Tâches lentes : mutation testing, E2E complets, deep security, vérif rapports d'étonnement. Notifie par email GitHub natif en cas de failure. |

Un dossier [`.github/actions/`](../actions/) contient 2 **composite actions** réutilisées dans les 2 workflows :
- [`setup-api`](../actions/setup-api/action.yml) : checkout + `uv` + `uv sync --frozen`
- [`setup-web`](../actions/setup-web/action.yml) : checkout + Node 22 + `npm ci`

## Topologie de `ci.yml` (fast CI)

Pattern **3 lanes parallèles indépendantes** (api / web / infra) + 1 job global (`secrets-scan`) + sentinelle `ci-ok`.

```
lane api    : lint-api   → format-api   → typecheck-api   → security-api   → test-unit-api   → test-integ-api   → build-api   ──┐
lane web    : lint-web   → format-web   → typecheck-web   → security-web   → test-unit-web   → test-integ-web   → build-web   ──┼→ ci-ok
lane infra  : lint-infra → format-infra → typecheck-infra → security-infra → test-infra      ──────────────────→  build-stack ──┘
global      : secrets-scan ──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Règles :**

- Chaque lane chaîne ses jobs en sequentiel via `needs:`. Si `lint-api` échoue, la suite de la lane api ne tourne pas.
- Les lanes ne s'attendent **pas** entre elles. L'api peut finir en succès même si web casse au lint.
- `secrets-scan` (Gitleaks) tourne en parallèle global — scan d'historique git, pas lié à un stack.
- `ci-ok` attend uniquement `build-api`, `build-web`, `build-stack`, `secrets-scan`. Les `security-*` et tests sont couverts transitively via les builds.

### Outils par étape (ci.yml)

| Étape | API | Web | Infra |
|---|---|---|---|
| `lint-*` | `ruff check` | `eslint` | `actionlint` |
| `format-*` | `ruff format --check` | `prettier --check` | `terraform fmt -check` |
| `typecheck-*` | `mypy` (strict) | `tsc --noEmit` | `terraform validate` |
| `security-*` | `semgrep` (p/python + security-audit, ERROR only) | `semgrep` (p/typescript + security-audit) | `checkov` (terraform + dockerfile, soft_fail baseline) |
| `test-unit-*` | `pytest -m unit` | `vitest run unit.test` | — |
| `test-integ-*` | `pytest -m integ` | `vitest run integ.test` | — |
| `test-infra` | — | — | `bash tests/infra/test_*.sh` |
| `build-*` | `docker build apps/api/` | `docker build apps/web/` | `docker compose config` |

`secrets-scan` : `gitleaks detect --source=. --redact --no-banner` (scan complet de l'historique git).

## Topologie de `ci-nightly.yml` (slow CI)

10 jobs parallèles + `nightly-summary` final (fan-in, step summary Markdown).

### Jobs tolerants (`continue-on-error: true`)

| Job | Outil | Raison tolerance |
|---|---|---|
| `mutation-api` | `mutmut` | Seuil 60% en rodage, baseline à affiner |
| `mutation-web` | `Stryker` | Idem, config Stryker pas encore validée |
| `e2e-api` | `pytest -m e2e` | Pas de tests E2E réels pour l'instant |
| `e2e-web` | `playwright test` | Idem |
| `review-reports-check` | shell + `gh api` | Signale dette, ne bloque pas le nightly |

### Jobs hard-required (bloquent le nightly)

| Job | Outil | Action sur failure |
|---|---|---|
| `pip-audit` | `pip-audit --strict` sur `uv export` | Email GitHub natif |
| `npm-audit` | `npm audit --audit-level=high` | Idem |
| `trivy-api` | `trivy image stacknest-api:nightly` (CRITICAL+HIGH) | Idem |
| `trivy-web` | `trivy image stacknest-web:nightly` | Idem |

### Step summary

`nightly-summary` génère un tableau Markdown visible sur la page du run GitHub Actions (onglet **Actions** → clique sur le run nightly). Aperçu :

```
# Nightly YYYY-MM-DD

| Category | Job | Result |
| --- | --- | --- |
| Mutation | mutation-api | success |
| E2E | e2e-api | success |
| Security | pip-audit | success |
| Review | reports-check | success |
```

## Notifications email

**Activation côté user (une fois, par développeur)** :

1. https://github.com/settings/notifications
2. Section **Actions**
3. ☑️ Email + ☑️ **Only notify for failed workflows**

Tu reçois un mail sur `samuel.ressiot@gmail.com` uniquement quand un workflow casse. Succès = silence.

*Plus tard* : un mail HTML enrichi via `dawidd6/action-send-mail` pourra remplacer la notification native quand SMTP sera configuré (ticket STN-35).

## Branch protection

**Un seul required status check à configurer** dans les settings du repo :

- Settings → Branches → Branch protection rules → `main`
- Require status checks to pass before merging : **`ci-ok`**

`ci-ok` est la sentinelle finale de `ci.yml` qui attend tous les builds + `secrets-scan`. Si lui est vert, tout le reste l'est aussi (par transitivité des `needs:`).

## Développement d'un nouveau workflow

Pour ajouter un job :

1. Décide de sa catégorie : **fast** (runs on every push, <1min idéalement) → `ci.yml` ; **slow** (>1min ou CVE DB refresh) → `ci-nightly.yml`
2. Si le job est lié à un stack (api/web/infra), insère-le dans la lane correspondante via `needs:` approprié. Sinon, garde-le standalone.
3. Utilise les composite actions `setup-api` / `setup-web` pour éviter la duplication de setup.
4. Avant de push, valide le YAML en local : `actionlint .github/workflows/*.yml` (installable via `brew install actionlint` ou équivalent).

## Debug un run qui casse

- Clique le run dans l'onglet **Actions** du repo
- Regarde le step summary (si nightly) pour voir quel job a cassé
- Clique sur le job pour voir les logs
- Re-run : "Re-run failed jobs" (économe, réutilise le cache)
