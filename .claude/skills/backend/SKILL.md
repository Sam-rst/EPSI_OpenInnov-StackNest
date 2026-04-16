---
name: backend
description: Guide backend feature implementation for StackNest (FastAPI + Clean Archi). Use when implementing any backend feature, endpoint, use case, or domain logic. Triggers on "implement backend", "create endpoint", "add use case", "new entity", "backend for STN-XX", or when working in apps/api/. This skill ensures every backend implementation follows the 1 file = 1 class convention, clean architecture layers, and project patterns.
---

# Backend — Feature Implementation Guide

Guide the implementation of a backend feature following the project's Clean Architecture + Vertical Slicing + Craft conventions. Read the DOR from the ticket before starting.

## When to use

- Implementing a new backend feature
- Adding an endpoint, use case, entity, or repository
- Working in `apps/api/`
- Called after `/tdd` sets up the test structure

## Process

1. **Read the DOR** — get the ticket from Jira (CA, périmètre, impact technique)
2. **Plan the files** — list every file to create, layer by layer
3. **Implement with TDD** — use `/tdd` for each business rule
4. **Validate architecture** — use `/clean-archi` to check layer violations
5. **Validate quality** — use `/craft` to check naming, SOLID, etc.

## File creation order

Always create files in this order (dependencies first):

```
1. Domain layer (no dependencies)
   ├── enums/          (if new enums needed)
   ├── value_objects/   (if new VOs needed)
   ├── exceptions/      (custom domain exceptions)
   ├── entities/        (dataclass + guard clauses)
   ├── interfaces/      (repository ABC)
   └── factories/       (if complex creation)

2. Infrastructure layer (depends on domain)
   ├── models/          (SQLAlchemy, Alembic migration)
   ├── mappers/         (entity ↔ model)
   └── repositories/    (implements interface)

3. Application layer (depends on domain)
   └── use_cases/       (1 file = 1 use case)

4. Presentation layer (depends on application)
   ├── schemas/         (Pydantic request/response)
   ├── dependencies.py  (Depends() wiring)
   └── router.py        (FastAPI routes)
```

## Templates

### Entity with guard clauses

```python
# domain/entities/template.py
from dataclasses import dataclass
from datetime import datetime
from ..enums.template_category import TemplateCategory
from ..exceptions.invalid_template import InvalidTemplateError

@dataclass
class Template:
    id: str
    name: str
    description: str
    category: TemplateCategory
    is_active: bool
    created_at: datetime

    def __post_init__(self):
        if not self.name or len(self.name) < 2:
            raise InvalidTemplateError("Le nom doit faire au moins 2 caractères")
        if len(self.description) > 500:
            raise InvalidTemplateError("Description trop longue (max 500)")
```

### Value Object

```python
# domain/value_objects/port.py
from dataclasses import dataclass
from ..exceptions.invalid_port import InvalidPortError

@dataclass(frozen=True)
class Port:
    value: int

    def __post_init__(self):
        if self.value < 1 or self.value > 65535:
            raise InvalidPortError(f"Port {self.value} invalide (1-65535)")
```

### Repository Interface

```python
# domain/interfaces/template_repository.py
from abc import ABC, abstractmethod
from ..entities.template import Template

class TemplateRepositoryInterface(ABC):
    @abstractmethod
    async def get_by_id(self, template_id: str) -> Template | None: ...

    @abstractmethod
    async def create(self, entity: Template) -> Template: ...
```

### Use Case

```python
# application/create_template.py
from ..domain.interfaces.template_repository import TemplateRepositoryInterface
from ..domain.factories.template_factory import TemplateFactory

class CreateTemplateUseCase:
    def __init__(self, repository: TemplateRepositoryInterface):
        self.repository = repository

    async def execute(self, data: CreateTemplateData) -> Template:
        entity = TemplateFactory.create(
            name=data.name,
            description=data.description,
            category=data.category,
        )
        return await self.repository.create(entity)
```

### Repository Implementation

```python
# infrastructure/repositories/template_repository.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from ...domain.interfaces.template_repository import TemplateRepositoryInterface
from ...domain.exceptions.template_not_found import TemplateNotFoundError
from ..mappers.template_mapper import TemplateMapper

class TemplateRepository(TemplateRepositoryInterface):
    def __init__(self, session: AsyncSession):
        self.session = session
        self.mapper = TemplateMapper()

    async def get_by_id(self, template_id: str) -> Template | None:
        try:
            model = await self.session.get(TemplateModel, template_id)
        except SQLAlchemyError as e:
            logger.error("database_error", error=str(e))
            raise InfrastructureError(f"Erreur BDD: {e}") from e
        if model is None:
            return None
        return self.mapper.to_entity(model)
```

### Router

```python
# presentation/router.py
from fastapi import APIRouter, Depends
from .dependencies import get_create_template_use_case
from .schemas.create_template_request import CreateTemplateRequest
from .schemas.template_response import TemplateResponse

router = APIRouter(prefix="/catalog/templates", tags=["catalog"])

@router.post("", status_code=201, response_model=TemplateResponse)
async def create_template(
    body: CreateTemplateRequest,
    use_case: CreateTemplateUseCase = Depends(get_create_template_use_case),
):
    result = await use_case.execute(body.to_data())
    return TemplateResponse.from_entity(result)
```

## Checklist before marking as done

- [ ] All files follow 1 file = 1 class
- [ ] Domain has no framework imports
- [ ] Use cases depend on interfaces, not implementations
- [ ] Infrastructure catches technical exceptions → domain exceptions
- [ ] Mappers convert entity ↔ model (never expose SQLAlchemy models)
- [ ] Router is thin (validate → call use case → return)
- [ ] Tests cover unit (.unit.) + integration (.integ.)
- [ ] Lint + type check = 0
- [ ] Alembic migration created if new tables
