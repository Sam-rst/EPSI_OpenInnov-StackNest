---
name: debug
description: Systematic debugging for StackNest using structlog, Sentry, and testcontainers. Use when encountering any bug, test failure, or unexpected behavior. Triggers on "bug", "error", "crash", "failing test", "doesn't work", "unexpected", "debug", "investigate". Follows a structured approach — reproduce first, hypothesize second, fix last.
---

# Debug — Systematic Debugging

Never guess. Follow a structured process: reproduce → isolate → understand → fix → verify. Use the project's tools (structlog, Sentry, testcontainers) to find the root cause.

## When to use

- Test is failing and you don't know why
- An endpoint returns an unexpected error
- A deployment fails silently
- Sentry reports an unhandled exception
- Something "doesn't work"

## Process (never skip steps)

### Step 1 — Reproduce

Before doing ANYTHING, reproduce the bug consistently.

- **Backend bug:** Write a failing test that demonstrates the bug
  ```python
  # tests/unit/catalog/test_bug_stn42.unit.py
  async def test_reproduces_duplicate_name_bug(self):
      """STN-42: creating template with existing name doesn't raise error."""
      # This should raise TemplateAlreadyExistsError but doesn't
      await use_case.execute(CreateTemplateData(name="PostgreSQL"))
      await use_case.execute(CreateTemplateData(name="PostgreSQL"))  # no error!
  ```

- **Frontend bug:** Write a failing test or reproduce in browser with DevTools open

- **Infra bug:** Check Docker logs
  ```bash
  docker compose logs api --tail=50
  docker compose logs worker --tail=50
  ```

If you can't reproduce it → check Sentry for the error context (stack trace, request data, user).

### Step 2 — Read the logs

StackNest uses structlog JSON. The logs tell you exactly what happened:

```bash
# Filter API logs for errors
docker compose logs api | grep '"level":"error"'

# Filter by specific request path
docker compose logs api | grep '"/catalog/templates"'

# Search Sentry for the exception
# → Check the stack trace, breadcrumbs, and request context
```

What to look for:
- The last INFO log before the error (what action triggered it)
- The ERROR log (the exception message and stack trace)
- The request context (method, path, body, user)

### Step 3 — Isolate

Narrow down which layer the bug is in:

| Symptom | Likely layer | How to check |
|---|---|---|
| 422 Validation Error | Presentation (schema) | Check Pydantic schema vs request body |
| 404 Not Found | Infrastructure (repo) | Check repository query, database state |
| 500 Internal Error | Infrastructure or Application | Check Sentry stack trace |
| Wrong data returned | Infrastructure (mapper) | Check mapper conversion (entity ↔ model) |
| Business rule violated | Application (use case) | Check use case logic |
| Entity invalid | Domain (guard clause) | Check __post_init__ validation |

### Step 4 — Understand the root cause

Don't fix the symptom — find the root cause.

Ask:
- **Why** does this happen? (not just what)
- **When** was it introduced? (`git log --oneline` on the affected files)
- **Where** else could this same bug exist? (similar patterns in other features)

### Step 5 — Fix with TDD

Use `/tdd` to fix the bug:

1. **RED:** Your reproducing test from Step 1 is already red → good
2. **GREEN:** Fix the code minimally to make the test pass
3. **BLUE:** Refactor if needed
4. Commit: `fix(STN-XX): green — description du fix`

### Step 6 — Verify no regression

```bash
# Run all tests, not just the one you fixed
uv run pytest                  # backend
npm run test                   # frontend

# Check lint + types
uv run ruff check . && uv run mypy .
npm run lint
```

## Common bugs by layer

### Domain
- Guard clause too strict/permissive → entity rejects valid data or accepts invalid
- Value Object edge case → Port(0), Email("@no-local-part")

### Application
- Use case doesn't handle None from repository → AttributeError on None.name
- Missing await on async call → coroutine object returned instead of result

### Infrastructure
- Mapper doesn't handle nullable fields → TypeError on None
- Repository doesn't catch IntegrityError → 500 instead of 409
- SQLAlchemy session not committed → data saved in memory but not in DB

### Presentation
- Schema field name mismatch with entity → field missing in response
- Missing `response_model` → raw dict returned instead of typed response

### Frontend
- DTO field snake_case not mapped → `undefined` in component
- React Query cache stale → old data displayed after mutation
- Missing error boundary → whole app crashes on one component error

## Debug tools

| Tool | When | Command |
|---|---|---|
| structlog (stdout) | Always first | `docker compose logs api` |
| Sentry | Unhandled exceptions | Check dashboard |
| pytest -x -s | First failing test with output | `uv run pytest -x -s tests/` |
| pdb | Step-through debugging | `import pdb; pdb.set_trace()` |
| React DevTools | Frontend state issues | Browser extension |
| React Query DevTools | Cache/fetch issues | Built-in dev panel |
| Network tab | API communication | Browser DevTools |
