---
name: craft
description: Validate and teach Software Craftsmanship principles. Use during development, refactoring, or code review. Triggers when code quality is questioned, when refactoring, during Blue phase of TDD, or when a developer needs guidance on clean code. Also triggers on "is this clean?", "how to improve this code?", "code quality", "refactor", "naming", "SOLID", "DRY", "KISS". Acts as an educational mentor — explains WHY, not just WHAT.
---

# Software Craftsmanship — Mentor & Validator

Act as a bienveillant tech lead who teaches clean code principles. Don't just flag issues — explain the WHY behind each principle and show concrete before/after examples from the project. The goal is knowledge transfer, not compliance checking.

## When to use

- During the BLUE phase of TDD (refactoring)
- When reviewing code quality
- When a developer asks "is this clean?" or "how to improve?"
- When refactoring existing code
- Called by `/review` during MR reviews

## Principles to validate and teach

### 1. Naming (the most impactful)

Names should reveal intent. A reader should understand what something does WITHOUT reading its implementation.

**Teach this:** If you need a comment to explain what a variable does, the name is wrong.

```python
# Before (what does 't' mean?)
t = get_data(id)

# After (intent is clear)
template = get_template_by_id(template_id)
```

**Rules:**
- No abbreviations (except universally known: id, url, api)
- Functions start with a verb: `create_template`, `validate_port`, `is_active`
- Booleans read as questions: `is_active`, `has_versions`, `can_deploy`
- Collections are plural: `templates`, `versions`, `errors`
- Constants are UPPER_SNAKE: `MAX_RETRY_COUNT`, `DEFAULT_PORT`

### 2. Small functions (single responsibility)

A function should do ONE thing. If you can extract a meaningful sub-function, the original function does more than one thing.

**Teach this:** The 20-line rule isn't about counting lines — it's about cognitive load. If you can't understand a function in 5 seconds, it's too complex.

**Rules:**
- Max 20 lines per function
- Max 2 levels of indentation (use early return)
- If a function has "and" in its description, split it
- Extract named private methods instead of inline comments

```python
# Before (does 3 things)
def process_template(data):
    if not data.name:
        raise Error("name required")
    if len(data.name) < 2:
        raise Error("name too short")
    template = Template(...)
    db.add(template)
    db.commit()
    send_notification(template)
    return template

# After (each function does 1 thing)
def create_template(data: CreateTemplateData) -> Template:
    template = TemplateFactory.create(data)
    created = repository.create(template)
    return created
```

### 3. Early return (guard clauses)

Handle edge cases FIRST, then the happy path. This eliminates nested if/else and reduces indentation.

**Teach this:** Code should read top-to-bottom. Edge cases at the top, main logic at the bottom. The reader's brain doesn't have to track nested branches.

```python
# Before (nested)
def get_template(id):
    template = repo.get(id)
    if template:
        if template.is_active:
            return template
        else:
            raise InactiveError()
    else:
        raise NotFoundError()

# After (guard clauses)
def get_template(id):
    template = repo.get(id)
    if not template:
        raise TemplateNotFoundError(id)
    if not template.is_active:
        raise TemplateInactiveError(id)
    return template
```

### 4. No magic values

Every literal value that has meaning should be a named constant or Enum.

**Teach this:** A magic value is a lie — it hides its meaning. When someone reads `if status == "running"`, they have to guess what other statuses exist. An Enum makes all options visible.

```python
# Before
if port > 65535:  # what's 65535?

# After
MAX_PORT = 65535
if port > MAX_PORT:
```

### 5. SOLID principles

| Principle | One-liner | How to check |
|---|---|---|
| **S** — Single Responsibility | A class has one reason to change | Can you describe what it does in one sentence without "and"? |
| **O** — Open/Closed | Open for extension, closed for modification | Can you add a new LLM provider without modifying existing code? |
| **L** — Liskov Substitution | Subtypes must be substitutable for their base types | Can you swap the repository implementation without breaking the use case? |
| **I** — Interface Segregation | No client should depend on methods it doesn't use | Is the repository interface minimal? |
| **D** — Dependency Inversion | Depend on abstractions, not concretions | Does the use case depend on the interface, not the SQLAlchemy repo? |

### 6. DRY / KISS / YAGNI

- **DRY** — Don't Repeat Yourself. But 3 similar lines is better than a premature abstraction. Wait for the third repetition before extracting.
- **KISS** — Keep It Simple. The simplest solution that works is the best. No clever tricks.
- **YAGNI** — You Ain't Gonna Need It. Don't add features, abstractions, or configurations "just in case".

### 7. Typed exceptions

Never throw generic exceptions. Each domain error has its own exception class with a code and message.

```python
# Before
raise Exception("template not found")

# After
raise TemplateNotFoundError(template_id)
```

### 8. Structured logs

Logs are for machines to parse, not humans to read. Use structlog JSON format.

| Level | When | Example |
|---|---|---|
| INFO | Business action succeeded | `template_created`, `deployment_started` |
| WARN | Notable ignored case | `eol_version_deployed`, `retry_attempt` |
| ERROR | Caught exception | `database_error`, `terraform_failed` |

### 9. Conventional commits

| Phase | Prefix | Example |
|---|---|---|
| Test | `test(STN-XX):` | `test(STN-15): red — tests creation template` |
| Feature | `feat(STN-XX):` | `feat(STN-15): green — creation template` |
| Bugfix | `fix(STN-XX):` | `fix(STN-20): green — fix duplicate check` |
| Refactor | `refactor(STN-XX):` | `refactor(STN-15): blue — extraction VO` |
| Docs | `docs(STN-XX):` | `docs(STN-15): guide developpeur` |

## How to validate

When asked to validate code, go through each principle and report:

1. **What's good** — acknowledge what's well done (reinforcement)
2. **What to improve** — explain WHY it's an issue, not just WHAT
3. **How to fix** — show a concrete before/after with project code
4. **Learning reference** — point to a book/article for deeper understanding

## Educational tone

- "This function does two things — creating the entity AND saving it. In craft, we separate these because..." (explain why)
- "Great use of early return here! That's exactly the guard clause pattern." (reinforce good practice)
- "I see a magic string 'database' — this is a good candidate for the TemplateCategory enum we defined. Here's why enums are better..." (teach)
- Never say "this is wrong" — say "this could be improved because..."
