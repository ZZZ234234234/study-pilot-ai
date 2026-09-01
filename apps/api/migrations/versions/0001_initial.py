"""Initial workspace schema, document relations, and pgvector extension."""

from alembic import op

from studypilot import models  # noqa: F401
from studypilot.db import Base

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    Base.metadata.create_all(bind=op.get_bind())


def downgrade():
    Base.metadata.drop_all(bind=op.get_bind())
