# Guide developpeur — backend StackNest

Ce guide decrit l'architecture, les conventions et la marche a suivre pour
creer une nouvelle feature dans le backend.

## Principes fondamentaux

### 1 fichier = 1 classe

Dans les **couches metier** des features (domain, application, infrastructure,
presentation), un fichier ne contient qu'**une seule classe**. Les modules
`__init__.py` peuvent re-exporter les symboles publics si besoin.

**Exception assumee pour `app/core/`** : le noyau technique transverse peut
contenir des **fonctions utilitaires** sans classe (`configure_logging`,
`init_sentry`, `register_exception_handlers`). La regle s'applique alors comme
**1 fichier = 1 responsabilite technique** :

- `core/config.py` -> la classe `Settings` (+ son factory `get_settings`)
- `core/logging.py` -> la fonction `configure_logging`
- `core/sentry.py` -> la fonction `init_sentry`
- `core/exception_handlers.py` -> la fonction `register_exception_handlers`
  (+ son handler prive `_handle_domain_exception`)
- `core/middleware/logging_middleware.py` -> la classe `LoggingMiddleware`

Tout nouveau fichier `core/` doit avoir un nom qui decrit sa responsabilite
et ne doit rien exporter d'autre.

**Pourquoi ?** Lisibilite, navigation IDE, diffs git ciblees, tests faciles a localiser.

### Clean Architecture + Vertical Slicing

Chaque feature (auth, catalog, deployment, chat, dashboard) est un **slice vertical
complet** — elle contient ses propres couches. Les features ne s'appellent pas
entre elles ; elles passent par `core/` (technique) ou `shared/` (abstractions
metier partagees).

Regle de dependance (du haut vers le bas, jamais l'inverse) :

```
presentation -> application -> domain
infrastructure -> domain (implemente les interfaces)
```

Le **domain ne depend de RIEN** (ni FastAPI, ni SQLAlchemy, ni Pydantic).

### TDD strict (Red -> Green -> Blue)

1. **RED** : ecrire le test qui echoue (commit `test(STN-XX): red — ...`)
2. **GREEN** : implementation minimale pour que le test passe (commit `feat(STN-XX): green — ...`)
3. **BLUE** : refacto sans changer le comportement (commit `refactor(STN-XX): blue — ...`)

Chaque phase termine par son propre commit. Pas de batch.

## Arborescence

### Etat actuel (scaffolding minimal)

```
apps/api/
├── app/
│   ├── __init__.py
│   ├── main.py                       # FastAPI entrypoint
│   ├── core/                         # Technique transverse
│   │   ├── config.py                 # Settings (pydantic-settings)
│   │   ├── logging.py                # configure_logging (structlog JSON)
│   │   ├── sentry.py                 # init_sentry (no-op si DSN absent)
│   │   ├── exception_handlers.py     # register_exception_handlers
│   │   └── middleware/
│   │       └── logging_middleware.py # LoggingMiddleware
│   └── shared/                       # Abstractions metier partagees
│       └── exceptions/
│           └── domain_exception.py   # DomainException (base)
├── conftest.py        # auto-markers pytest selon le suffixe du fichier
├── tests/
│   └── e2e/
│       └── scenarios/ # *.e2e.py — scenarios cross-feature uniquement
└── pyproject.toml
```

Les dossiers de features (`auth/`, `catalog/`, ...) sont **crees au moment ou
la feature arrive** — chaque ticket porte la creation de son dossier.

### Structure cible d'une feature

```
app/{feature}/
├── domain/
│   ├── entities/        # Classes metier (1 fichier = 1 entite)
│   ├── value_objects/   # frozen dataclass + __post_init__ (guard clauses)
│   ├── enums/           # str Enum, jamais de magic strings
│   ├── interfaces/      # ABC — contrats de repository
│   ├── exceptions/      # Specifiques a la feature, herite de DomainException
│   ├── factories/       # Creation complexe d'entites (UUID, defaults)
│   └── events/          # Domain events
├── application/
│   ├── use_cases/       # 1 fichier = 1 use case
│   ├── commands/        # DTO ecriture (dataclass pure)
│   ├── queries/         # DTO lecture (CQRS optionnel)
│   ├── results/         # DTO sortie use case
│   ├── ports/           # Interfaces services externes (LLM, Terraform, Email)
│   └── handlers/        # Event handlers applicatifs
├── infrastructure/
│   ├── models/          # SQLAlchemy models
│   ├── repositories/    # Implementation des interfaces du domain
│   └── mappers/         # Entity <-> SQLAlchemy model
└── presentation/
    ├── routers/         # APIRouter FastAPI, 1 fichier par ressource
    ├── schemas/
    │   ├── requests/    # Pydantic input HTTP
    │   └── responses/   # Pydantic output HTTP
    ├── mappers/         # Schema <-> Command, Entity <-> Response
    └── dependencies/    # Depends() FastAPI (get_current_user, pagination...)
```

## Regles de placement

| Si le code est... | Place-le dans... |
|---|---|
| Config, DB, Redis, logging, sentry, security, middleware, deps FastAPI transverses | `app/core/` |
| Une abstraction metier utilisee par >= 2 features (ex : `DomainException`, `UserId` VO) | `app/shared/` |
| Logique metier d'une feature precise | `app/{feature}/` (vertical slicing complet) |

**Regle stricte** : `app/shared/` n'a **aucune** dependance sortante vers une feature.
Si tu te retrouves a ecrire `from app.catalog... import ...` dans `app/shared/`, c'est
que ton abstraction n'est pas vraiment partagee — elle appartient a `catalog/`.

## Conventions Software Craftsmanship (phase Blue)

- **Naming explicite** — pas d'abreviation, pas de `data`, `obj`, `tmp`.
- **Fonctions <= 20 lignes**, single responsibility.
- **Early return** — pas de `if/else` imbriques.
- **Constantes nommees** (Enums) — pas de magic strings.
- **Logs structures** (`structlog.get_logger(__name__).info("event_name", key=value)`).
- **Exceptions custom typees** — `class TemplateNotFoundException(DomainException): ...`.
- **Try/catch** uniquement sur l'**infrastructure** (reseau, DB, timers).
  Le handler global transforme les `DomainException` en HTTP — pas de try/catch
  dans les use cases ni les routers.
- **Value Objects** (frozen dataclass) pour les types avec validation metier
  (Email, Port, DatabaseName).
- **Guard clauses** dans les entites (`__post_init__`).
- **Factories** pour la creation complexe (UUID, defaults, dependances).
- **Commands / Queries / Results** = dataclasses pures, **distinctes** des
  Schemas Pydantic HTTP (decouple application <-> presentation).

## Logs et exceptions

### Logs structures (structlog JSON)

```python
import structlog

logger = structlog.get_logger(__name__)

logger.info("template_created", template_id=str(template.id), name=template.name)
logger.warning("quota_exceeded", user_id=str(user.id), quota=10)
logger.error("terraform_apply_failed", deployment_id=str(deployment.id))
```

Tous les logs sortent en JSON sur stdout (config centrale `app/core/logging.py`).
Niveaux : `INFO` actions normales, `WARNING` cas ignores, `ERROR` exceptions.

### DomainException -> HTTP

Le handler global (`app/core/exception_handlers.py`) intercepte toute
`DomainException` et renvoie :

```json
{ "error": "TEMPLATE_NOT_FOUND", "message": "Template introuvable" }
```

avec le `http_status` configure dans l'exception.

```python
from app.shared.exceptions.domain_exception import DomainException


class TemplateNotFoundException(DomainException):
    def __init__(self, template_id: str) -> None:
        super().__init__(
            code="TEMPLATE_NOT_FOUND",
            message=f"Template {template_id} introuvable",
            http_status=404,
        )
```

## Tests

### Convention co-located `__tests__/`

Les tests vivent a cote du code qu'ils testent, dans un dossier
`__tests__/{unit,integration}/` selon le niveau. Cette convention est la
meme que cote frontend (consistance DX).

**Avantages :**

- Pas de duplication de la structure (source de verite unique = `app/`).
- Supprimer un dossier supprime aussi ses tests.
- Navigation naturelle : les tests d'une entite sont dans le meme dossier
  que l'entite.

**Arbre type d'une feature :**

```
app/auth/
├── domain/
│   ├── entities/
│   │   ├── __tests__/
│   │   │   └── unit/
│   │   │       └── test_user_entity.unit.py
│   │   └── user.py
│   ├── value_objects/
│   │   ├── __tests__/
│   │   │   └── unit/
│   │   │       └── test_email_vo.unit.py
│   │   └── email.py
│   └── factories/
│       ├── __tests__/
│       │   └── unit/
│       │       └── test_user_factory.unit.py
│       └── user_factory.py
├── application/
│   └── use_cases/
│       ├── __tests__/
│       │   ├── unit/                                  # mocks uniquement
│       │   │   └── test_login_use_case.unit.py
│       │   └── integration/                           # vrai adapter
│       │       └── test_register_use_case.integ.py
│       └── login.py
├── infrastructure/
│   └── repositories/
│       ├── __tests__/
│       │   └── integration/                           # real DB via testcontainers
│       │       └── test_user_repository.integ.py
│       └── user_repository.py
└── presentation/
    └── routers/
        ├── __tests__/
        │   └── integration/                           # real ASGI via httpx
        │       └── test_auth_router.integ.py
        └── auth_router.py
```

**E2E** : reste au top niveau dans `tests/e2e/scenarios/` car par nature
cross-feature.

**YAGNI** : pas de dossier vide. On cree `__tests__/unit/` ou
`__tests__/integration/` seulement quand on y met un test.

### Regles par couche

| Couche | Unit | Integ |
|---|---|---|
| `domain/entities` | Oui | Non |
| `domain/value_objects` | Oui | Non |
| `domain/factories` | Oui | Non |
| `domain/interfaces` | Non (ABC) | Non |
| `domain/exceptions` | Optionnel | Non |
| `application/use_cases` | Oui (mocks) | Parfois (stack reel) |
| `application/commands` / `queries` / `results` | Non (dataclass pur) | Non |
| `application/ports` | Non (ABC) | Non |
| `infrastructure/repositories` | Non | Oui (real DB) |
| `infrastructure/mappers` | Oui | Rare |
| `presentation/routers` | Non | Oui (real ASGI) |

### Suffixe = source de verite du niveau

- `test_*.unit.py`  -> marker `unit` auto-applique
- `test_*.integ.py` -> marker `integ` auto-applique
- `test_*.e2e.py`   -> marker `e2e` auto-applique

Le hook est dans `conftest.py` a la racine de `apps/api/`.

### Commandes

| Commande | Effet |
|---|---|
| `uv run pytest` | Tout |
| `uv run pytest -m unit` | Unit uniquement (boucle TDD rapide) |
| `uv run pytest -m integ` | Integration uniquement |
| `uv run pytest -m e2e` | E2E uniquement |
| `uv run pytest app/auth/` | Tous les tests du slice auth |
| `uv run pytest app/auth/domain/entities/__tests__/unit/` | Tests unit des entites auth |

## Mutation testing (mutmut)

La couverture de tests dit "ce code est execute". Le **mutation testing** dit
"les tests detectent vraiment un changement de comportement". C'est le filet
complementaire qui rend la coverage credible.

### Cible

On mute uniquement la **logique metier** :

- `app/core/` — config, handlers, middleware (technique transverse)
- `app/shared/` — abstractions metier partagees
- `app/{feature}/application/` — use cases, services
- `app/{feature}/domain/` — entities, value objects (les regles metier)

On **ne mute pas** :

- `app/{feature}/infrastructure/` — couvert par les tests d'integration ASGI / DB
- `app/{feature}/presentation/` — meme raison

A chaque nouvelle feature, ajoute son `application/` et `domain/` dans
`paths_to_mutate` (`pyproject.toml`, section `[tool.mutmut]`).

### Comment lancer

Mutmut **n'est pas supporte natif sur Windows** ([issue 397](https://github.com/boxed/mutmut/issues/397)).
Deux modes d'execution :

**1. CI (GitHub Actions Linux)** — execution automatique a chaque PR.

**2. Local (Docker, cross-platform)** :

```bash
docker run --rm -v "${PWD}":/app -w /app python:3.13-slim \
  sh -c "pip install uv && uv sync --frozen && uv run mutmut run"
```

Plus tard, quand `infra/docker/docker-compose.dev.yml` existera (STN-11), un
service `mutmut` permettra : `docker compose run --rm mutmut`.

### Seuil & interpretation

- **Seuil de demarrage : 60% mutation score** — point de depart, a durcir
  progressivement vers 80% au fil des sprints.
- **Mutation tuee** = un test a echoue quand on a modifie le code -> bon
  signal, le test est utile.
- **Mutation survivante** = aucun test n'a echoue -> ton test ne couvre pas
  vraiment ce comportement, il faut renforcer ou ajouter un cas.
- **Mutation timeout / suspicious** = a investiguer manuellement.

Mutation testing est **lent** (1 fichier modifie = N runs de la suite). Ne le
lance pas dans la boucle TDD — reserve-le aux relectures de fin de feature
ou a la CI.

## Comment creer une nouvelle feature

1. **Lire le ticket Jira** (STN-XX) — perimetre, criteres d'acceptation, scenarios de test.
2. **Creer la branche** : `git checkout -b feature/STN-XX-description`.
3. **Creer le dossier feature** : `app/{feature}/` avec les sous-dossiers strictement necessaires (YAGNI — pas de pre-creation).
4. **TDD** : pour chaque CA, Red -> Green -> Blue avec un commit par phase.
5. **Lint + types** : `uv run ruff check . && uv run mypy .` (0 erreur).
6. **Couverture** : `uv run pytest --cov=app` (>= 80% global, 90% sur le metier).
7. **Pousser** + ouvrir une PR vers `main`.
