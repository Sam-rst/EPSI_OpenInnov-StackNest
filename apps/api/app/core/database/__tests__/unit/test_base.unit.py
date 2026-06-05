"""Tests unitaires de la base declarative SQLAlchemy partagee."""

from sqlalchemy.orm import DeclarativeBase

from app.core.database.base import Base


class TestDeclarativeBase:
    def test_base_herite_de_declarative_base(self) -> None:
        assert issubclass(Base, DeclarativeBase)

    def test_metadata_definit_une_naming_convention_complete(self) -> None:
        convention = Base.metadata.naming_convention

        assert convention["ix"] == "ix_%(column_0_label)s"
        assert convention["uq"] == "uq_%(table_name)s_%(column_0_name)s"
        assert convention["ck"] == "ck_%(table_name)s_%(constraint_name)s"
        assert convention["fk"] == (
            "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s"
        )
        assert convention["pk"] == "pk_%(table_name)s"
