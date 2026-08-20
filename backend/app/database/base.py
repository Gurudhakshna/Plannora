"""
SQLAlchemy declarative base.

All ORM models should inherit from Base defined here.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass
