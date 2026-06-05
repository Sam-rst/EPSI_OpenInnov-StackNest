"""Base declarative SQLAlchemy partagee par tous les modeles ORM.

Toutes les features (auth, catalog, deployment, chat, ...) declarent leurs
modeles en heritant de cette `Base` unique pour partager un seul `MetaData`.
C'est ce `MetaData` que Alembic cible (`target_metadata`) pour autogenerer
les migrations.

La **naming convention** rend deterministes les noms de contraintes (index,
unique, foreign key, check, primary key). Sans elle, SQLAlchemy laisse la
base nommer les contraintes, ce qui produit des noms non portables et casse
les migrations `--autogenerate` (impossible de DROP une contrainte dont on
ne connait pas le nom). La convention garantit des diffs symetriques et
reproductibles entre environnements.
"""

from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

# Convention de nommage des contraintes (recommandation officielle Alembic).
# %(...)s sont des tokens interpoles par SQLAlchemy au moment du DDL.
NAMING_CONVENTION: dict[str, str] = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """Classe de base ORM commune (un seul `MetaData` pour tout le projet)."""

    metadata = MetaData(naming_convention=NAMING_CONVENTION)
