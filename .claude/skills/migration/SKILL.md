---
name: migration
description: Guide creation of Alembic database migrations for StackNest. Use when creating new tables, modifying schema, adding columns, or any database change. Triggers on "migration", "alembic", "new table", "add column", "schema change", "database change", or when a ticket involves database impact. Ensures every migration has upgrade + downgrade + test.
---

# Migration — Alembic Database Migration Guide

Guide the creation of safe, testable database migrations. Every migration must have an upgrade, a downgrade, and a test that verifies both directions work.

## When to use

- Creating new tables (new feature with domain entities)
- Modifying existing schema (add column, change type, add index)
- Any ticket with "Base de données" in the Impact technique section
- When adding models in infrastructure/models/

## Process

1. **Check the entity** — the domain entity must exist first (domain drives the schema, not the reverse)
2. **Create the SQLAlchemy model** — in infrastructure/models/ (mirrors the entity)
3. **Create the mapper** — in infrastructure/mappers/ (entity ↔ model)
4. **Generate the migration** — `alembic revision --autogenerate -m "description"`
5. **Review the generated migration** — autogenerate is a starting point, not the final version
6. **Add downgrade** — verify the downgrade actually reverses the upgrade completely
7. **Add seed data** — if the feature needs initial data (templates, enums)
8. **Test the migration** — upgrade → verify → downgrade → verify → upgrade again
9. **Commit** — `feat(STN-XX): migration — description`

## Migration file structure

```python
"""create template tables

Revision ID: abc123
Revises: previous_id
Create Date: 2026-04-16
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "abc123"
down_revision = "previous_id"

def upgrade() -> None:
    op.create_table(
        "templates",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("category", sa.String(20), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_templates_category", "templates", ["category"])

def downgrade() -> None:
    op.drop_index("ix_templates_category", table_name="templates")
    op.drop_table("templates")
```

## Rules

- **Downgrade is mandatory** — if you can't downgrade cleanly, the migration is not safe for deployment
- **One concern per migration** — don't mix table creation with data migration in the same file
- **Never modify a released migration** — create a new one instead
- **Index naming convention** — `ix_{table}_{column}` for indexes, `uq_{table}_{column}` for unique constraints
- **UUID as string** — `sa.String(36)` for UUID primary keys (not PostgreSQL UUID type, for portability)
- **Default values** — use `server_default` (database-level) not `default` (Python-level)
- **Seed data in separate migration** — data inserts go in their own migration file after the schema migration

## Testing migration

```python
# tests/integration/test_migration.integ.py
async def test_migration_upgrade_downgrade(db_engine):
    """Verify migration applies and reverts cleanly."""
    # Upgrade to head
    alembic_upgrade(db_engine, "head")
    
    # Verify table exists
    assert table_exists(db_engine, "templates")
    
    # Downgrade one step
    alembic_downgrade(db_engine, "-1")
    
    # Verify table removed
    assert not table_exists(db_engine, "templates")
    
    # Re-upgrade (idempotent)
    alembic_upgrade(db_engine, "head")
    assert table_exists(db_engine, "templates")
```

## Common mistakes to avoid

- Forgetting to add indexes on foreign keys (PostgreSQL doesn't auto-index FKs)
- Using `nullable=True` by default — be explicit, most columns should be `nullable=False`
- Not testing the downgrade — "I'll never need to rollback" is famous last words
- Mixing schema changes and data changes — separate migrations for each
