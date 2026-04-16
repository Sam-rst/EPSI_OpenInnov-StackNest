---
name: tdd
description: Strict TDD workflow (Red → Green → Blue) for StackNest. Use this skill BEFORE writing any implementation code — for every feature, bugfix, or refactoring. Triggers on "implement", "develop", "code", "fix", "new feature", "start coding", or when a ticket moves to "En développement". This skill enforces the Software Craftsmanship discipline with commits at each phase.
---

# TDD — Red → Green → Blue (strict)

Enforce strict Test-Driven Development for every piece of code. Never write implementation before tests. Commit at each phase. The Blue phase respects Software Craftsmanship principles.

## When to use

- Before implementing ANY feature or bugfix
- When a ticket moves to "En développement"
- User says "implement", "develop", "code", "fix", "start coding"
- ALWAYS before writing implementation code — no exceptions

## The Cycle

For each business rule (not the whole ticket — break it into small rules):

```
🔴 RED — Write the test
  ↓
  Run tests → MUST BE RED
  ↓
  Commit: test(STN-XX): red — [description]
  ↓
🟢 GREEN — Write the simplest implementation
  ↓
  Run tests → MUST BE GREEN
  ↓
  Commit: feat(STN-XX): green — [description]
  ↓
🔵 BLUE — Refactor until ALL Craft criteria pass
  ↓
  After EACH refactoring change → run tests → MUST STAY GREEN
  ↓
  If tests go RED → STOP, revert last change (regression!)
  ↓
  When all Craft criteria pass → Commit: refactor(STN-XX): blue — [description]
  ↓
→ Next business rule...
```

## HARD RULES

1. **NEVER write implementation before the test exists and is RED**
2. **NEVER skip the commit between phases** — each phase has its own commit
3. **The GREEN phase must be the STUPIDEST possible implementation** — no optimization, no elegance, just make it pass
4. **The BLUE phase must NEVER make tests RED** — if a test goes red during refactoring, it's a regression, revert immediately
5. **One business rule at a time** — don't test 5 things then implement 5 things

## Phase Details

### 🔴 RED — Write the failing test

1. Read the DOR of the ticket (Jira) — specifically the Critères d'acceptation
2. Pick ONE business rule to implement
3. Write the test file following naming convention:
   - Backend: `test_[rule].unit.py` or `test_[rule].integ.py`
   - Frontend: `[Component].unit.test.tsx` or `[hook].unit.test.ts`
4. Write the test — it should express the business rule in Given/When/Then:

```python
# Backend example
class TestCreateTemplate:
    async def test_creates_template_with_valid_data(self, use_case, mock_repo):
        """Étant donné des données valides, quand on crée un template, alors il est retourné avec un ID."""
        # Given
        data = CreateTemplateData(name="PostgreSQL", category=TemplateCategory.DATABASE)
        # When
        result = await use_case.execute(data)
        # Then
        assert result.name == "PostgreSQL"
        mock_repo.create.assert_called_once()
```

```typescript
// Frontend example
describe("templateMapper.fromDTO", () => {
    it("convertit snake_case en camelCase", () => {
        // Given
        const dto: TemplateDTO = { created_at: "2026-04-16T10:00:00Z", ... }
        // When
        const model = templateMapper.fromDTO(dto)
        // Then
        expect(model.createdAt).toBeInstanceOf(Date)
    })
})
```

5. Run the tests → **they MUST be RED** (the implementation doesn't exist yet)
6. If tests are NOT red → the test is wrong (testing something that already exists)
7. **Commit:**

```bash
git add -A && git commit -m "test(STN-XX): red — [business rule description]"
```

### 🟢 GREEN — Simplest possible implementation

1. Write the MINIMUM code to make the tests pass
2. No optimization, no refactoring, no clever solutions
3. Hardcode values if that's the simplest way to pass
4. The goal is GREEN, not beautiful

```python
# This is OK for GREEN phase:
class CreateTemplateUseCase:
    async def execute(self, data):
        entity = Template(id=str(uuid4()), name=data.name, category=data.category)
        return await self.repository.create(entity)
```

5. Run the tests → **they MUST be GREEN**
6. If tests are still red → fix the implementation (not the test!)
7. **Commit:**

```bash
git add -A && git commit -m "feat(STN-XX): green — [business rule description]"
```

For bugfixes, use `fix(STN-XX)` instead of `feat(STN-XX)`.

### 🔵 BLUE — Refactor with Craft discipline

The Blue phase is a LOOP. After EACH change, run the tests. If they stay green, continue. If they go red, revert.

**Craft checklist — all must pass to exit Blue:**

| # | Criterion | Check |
|---|---|---|
| 1 | Tests still GREEN | Run after every single change |
| 2 | Explicit naming | Variables, functions, classes — readable without context |
| 3 | Functions <= 20 lines | Single responsibility |
| 4 | Early return | Max 2 levels of indentation |
| 5 | No duplication | DRY — but no premature abstraction |
| 6 | No magic values | Named constants, Enums |
| 7 | Explicit types | No `any` (TS), no implicit types (Python) |
| 8 | Typed exceptions | DomainException, not generic Exception |
| 9 | Value Objects | Types with business validation are VOs (frozen dataclass) |
| 10 | 1 file = 1 class | Respected across all layers |
| 11 | Lint + type check = 0 | ruff + mypy (back), eslint + prettier (front) |

**The refactoring loop:**

```
for each criterion not yet met:
    1. Make ONE small change
    2. Run tests
    3. If GREEN → continue
    4. If RED → git checkout -- . (revert) → try a different approach
```

**Common Blue phase refactorings:**
- Extract a Value Object (e.g., TemplateName with validation)
- Rename a variable/function for clarity
- Extract a private method to respect <= 20 lines
- Replace magic string with Enum
- Add guard clause in entity (__post_init__)
- Move a class to its own file (1 file = 1 class)

8. When ALL criteria pass:

```bash
git add -A && git commit -m "refactor(STN-XX): blue — [what was refactored]"
```

## Commit Convention

| Phase | Prefix | Example |
|---|---|---|
| RED | `test(STN-XX):` | `test(STN-15): red — tests creation template` |
| GREEN | `feat(STN-XX):` | `feat(STN-15): green — creation template` |
| GREEN (bugfix) | `fix(STN-XX):` | `fix(STN-20): green — fix duplicate name check` |
| BLUE | `refactor(STN-XX):` | `refactor(STN-15): blue — extraction VO TemplateName` |

Commits are in **French** for the description, English for the prefix.

## Test Levels

Choose the right test level based on what you're testing:

| What | Level | Backend | Frontend |
|---|---|---|---|
| Use case logic | unit | mock repo | — |
| Entity/VO validation | unit | no mock | — |
| Mapper conversion | unit | no mock | no mock |
| Component render | unit | — | Testing Library |
| Hook behavior | unit | — | React Query mock |
| Repository + DB | integ | testcontainers | — |
| Endpoint HTTP | integ | httpx AsyncClient | — |
| Page + API | integ | — | MSW |
| Full flow | e2e | all real services | Playwright |

**Start with unit tests (RED), implement (GREEN), refactor (BLUE). Add integration/E2E tests for the same rule AFTER the unit cycle is complete.**

## Architecture Reference

When creating files during GREEN/BLUE phases, follow the project architecture:

**Backend:** `apps/api/app/{feature}/domain/entities/`, `value_objects/`, `enums/`, `interfaces/`, `exceptions/`, `factories/`, `application/`, `infrastructure/models/`, `repositories/`, `mappers/`, `presentation/schemas/`

**Frontend:** `apps/ui/src/{feature}/types/dto/`, `types/models/`, `types/enums/`, `types/guards/`, `mappers/`, `services/`, `hooks/`, `components/`, `pages/`

**Tests:** `apps/api/tests/unit/`, `integration/`, `e2e/` with `.unit.`, `.integ.`, `.e2e.` naming convention. Same for `apps/ui/tests/`.

## Example: Full TDD Cycle

Ticket STN-15: "Créer un template dans le catalogue"

**Rule 1: "Un template a un nom, une description et une catégorie"**

🔴 RED:
```
tests/unit/catalog/domain/test_template_entity.unit.py
→ test_template_has_name_description_category()
→ RUN → RED (Template class doesn't exist)
→ COMMIT: test(STN-15): red — entite template avec nom description categorie
```

🟢 GREEN:
```
apps/api/app/catalog/domain/entities/template.py
→ @dataclass Template with name, description, category
→ RUN → GREEN
→ COMMIT: feat(STN-15): green — entite template basique
```

🔵 BLUE:
```
→ Check: naming OK? types explicit? guard clauses? 
→ Add __post_init__ validation (name min 2 chars)
→ RUN → GREEN ✓
→ Add TemplateCategory enum (not magic string)
→ RUN → GREEN ✓
→ Lint + mypy → 0 errors ✓
→ COMMIT: refactor(STN-15): blue — guard clauses, enum categorie
```

**Rule 2: "Le nom du template doit être unique"**

🔴 RED → 🟢 GREEN → 🔵 BLUE → next rule...
