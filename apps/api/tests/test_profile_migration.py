"""Exercise additive migration against both old and fresh disposable schemas."""

import importlib.util
from pathlib import Path

from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine, inspect, text


def test_old_records_survive_additive_migration_and_second_run():
    spec = importlib.util.spec_from_file_location(
        "profile_migration",
        Path(__file__).parents[1] / "migrations/versions/0002_ai_profiles.py",
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    engine = create_engine("sqlite://")
    with engine.begin() as db:
        db.execute(text("CREATE TABLE users (id VARCHAR(36) PRIMARY KEY, created_at DATETIME)"))
        db.execute(text("CREATE TABLE chat_messages (id VARCHAR(36) PRIMARY KEY, content TEXT)"))
        db.execute(text("INSERT INTO users (id) VALUES ('existing-owner')"))
        db.execute(
            text("INSERT INTO chat_messages VALUES ('old-answer', 'Keep my original answer')")
        )
        module.op = Operations(MigrationContext.configure(db))
        module.upgrade()
        module.upgrade()  # A fresh install via 0001's live metadata has the same existing columns.
        assert "ai_profiles" in inspect(db).get_table_names()
        assert {"model_label", "retrieval"} <= {
            c["name"] for c in inspect(db).get_columns("chat_messages")
        }
        assert db.scalar(text("SELECT content FROM chat_messages")) == "Keep my original answer"
        assert db.scalar(text("SELECT id FROM users")) == "existing-owner"
        assert db.scalar(text("SELECT ai_profile_id FROM users")) is None
    engine.dispose()
