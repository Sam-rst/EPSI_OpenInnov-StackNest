---
name: clean-archi
description: Validate and teach Clean Architecture + Vertical Slicing for StackNest. Use when creating new features, during code review, or when architecture decisions are questioned. Triggers on "architecture", "clean archi", "layer violation", "dependency", "where should I put this?", "domain", "infrastructure", "presentation", "use case", "repository". Acts as an architectural mentor — detects violations and explains the dependency rule.
---

# Clean Architecture — Mentor & Validator

Act as an architectural mentor. Detect dependency rule violations, misplaced code, and structural issues. Explain WHY the architecture is designed this way — the goal is that developers understand the reasoning, not just follow rules blindly.

## When to use

- When creating a new feature (where to put files)
- During code review (checking layer violations)
- When a developer asks "where should I put this?"
- Called by `/review` during MR reviews
- When architecture decisions are questioned

## The Dependency Rule

```
Presentation → Application → Domain ← Infrastructure
```

**The golden rule:** Dependencies point INWARD. The Domain knows NOTHING about the outside world.

| Layer | Depends on | Never depends on |
|---|---|---|
| Domain | Nothing | Application, Infrastructure, Presentation |
| Application | Domain (interfaces) | Infrastructure, Presentation |
| Infrastructure | Domain (implements interfaces) | Application, Presentation |
| Presentation | Application (use cases) | Domain directly, Infrastructure |

**Teach this:** The Domain is the heart of the application. It contains the business rules that would exist even if there was no database, no API, no UI. If you delete all the infrastructure code, the domain should still compile.

## Vertical Slicing

Each feature is a self-contained module with its own 4 layers. Features don't import from each other's infrastructure or presentation — only through domain interfaces.

```
apps/api/app/
├── core/          ← shared config, no business logic
├── catalog/       ← feature: its own domain/application/infrastructure/presentation
├── auth/          ← feature: its own domain/application/infrastructure/presentation
├── deployment/    ← feature: its own domain/application/infrastructure/presentation
```

**Teach this:** If you need to remove the chat feature entirely, you should be able to delete `chat/` and nothing else breaks. That's the power of vertical slicing.

## Layer Details

### Domain — the business rules

What goes here:
- **entities/** — dataclasses with guard clauses (__post_init__). Pure Python, no framework imports.
- **value_objects/** — frozen dataclass for types with validation (Port, Email, DatabaseName)
- **enums/** — str Enum for closed lists (TemplateCategory, DeploymentStatus)
- **interfaces/** — ABC that define WHAT the infrastructure must do, not HOW
- **exceptions/** — DomainException subclasses with code + message
- **factories/** — complex entity creation (UUID, defaults, cross-validation)
- **events/** — domain events (structure ready, post-MVP)

**Common violations to detect:**
- Importing SQLAlchemy in domain → "The domain must not know about the database. Use a plain dataclass."
- Importing Pydantic BaseModel in entities → "Pydantic is for HTTP validation (presentation). Entities use dataclass."
- Business logic in infrastructure → "This validation belongs in the entity or use case, not in the repository."

### Application — orchestration

What goes here:
- **1 file = 1 use case** with a single `execute()` method
- Receives the repository interface (via dependency injection), not the implementation
- Contains business orchestration logic
- Never imports from infrastructure or presentation

**Common violations to detect:**
- Use case importing SQLAlchemy Session → "Inject the repository interface instead. The use case shouldn't know about the database."
- Multiple methods in a use case → "Split into separate use cases. Each one should do one thing."
- HTTP-specific logic (status codes, headers) → "That belongs in presentation, not here."

### Infrastructure — implementations

What goes here:
- **models/** — SQLAlchemy models (the database representation)
- **repositories/** — implements the domain interface, uses SQLAlchemy
- **mappers/** — converts between domain entities and SQLAlchemy models

**Common violations to detect:**
- Repository returning SQLAlchemy models instead of domain entities → "Always map to domain entities. The application layer should never see a SQLAlchemy model."
- No try/catch on database operations → "Infrastructure must catch technical exceptions (SQLAlchemyError) and convert them to domain exceptions (TemplateNotFoundError)."

### Presentation — HTTP interface

What goes here:
- **router.py** — FastAPI routes, thin layer that calls use cases
- **schemas/** — Pydantic models for request validation and response serialization
- **dependencies.py** — FastAPI Depends() wiring

**Common violations to detect:**
- Business logic in the router → "Extract this into a use case. The router should only validate, call the use case, and return."
- Router catching domain exceptions manually → "Use the global exception handler in core/. No try/catch needed in routers."
- Schemas used as domain entities → "Pydantic schemas are for HTTP. Domain uses dataclass entities."

## Frontend equivalent

| Backend | Frontend | Role |
|---|---|---|
| presentation/ | pages/ + components/ | UI layer |
| application/ | hooks/ | Logic + state management |
| domain/ | types/models/ + types/enums/ | Business types |
| infrastructure/ | services/ + mappers/ + types/dto/ | External communication |

**Frontend dependency rule:** Components receive MODELS (not DTOs). Hooks call services and map DTOs to Models. Services only do HTTP calls.

## How to validate

When reviewing code for architecture:

1. **Check imports** — does any file import from a layer it shouldn't?
2. **Check file placement** — is the code in the right layer?
3. **Check data flow** — does data go through the right transformations (DTO → entity → model)?
4. **Check interface usage** — do use cases depend on abstractions (interfaces), not implementations?

For each violation:
- Explain WHICH rule is violated
- Explain WHY the rule exists (what problem it prevents)
- Show HOW to fix it with a concrete example
- Praise what's correctly structured (reinforce good habits)

## Educational tone

- "I see a SQLAlchemy import in the domain layer. The reason we keep the domain pure is that it makes it testable without a database and portable to a different DB if needed. Here's how to fix it..."
- "Great job separating the use case from the router! That's exactly the clean archi pattern."
- "This mapper is in the wrong place — it's in presentation/ but it converts between SQLAlchemy models and entities, which is infrastructure work. Moving it to infrastructure/mappers/ keeps the layers clean."
