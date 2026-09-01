import os
from collections.abc import Generator
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import NullPool

from .config import get_settings


class Base(DeclarativeBase):
    pass


@lru_cache
def get_engine():
    url = get_settings().database_url
    if not url:
        raise RuntimeError("DATABASE_URL is missing. Run `make dev` or configure PostgreSQL.")
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    if os.environ.get("DEV_DB") == "true":
        return create_engine(url, poolclass=NullPool, connect_args={"prepare_threshold": None})
    return create_engine(url, pool_pre_ping=True, pool_size=5, max_overflow=5)


def session_factory() -> Session:
    return sessionmaker(get_engine(), expire_on_commit=False)()


def get_db() -> Generator[Session, None, None]:
    with session_factory() as session:
        yield session
