"""Private per-workspace AI configuration and immutable answer provenance."""

import sqlalchemy as sa
from alembic import op

from studypilot.models import AIProfile

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    # 0001 uses live metadata: on a fresh install these may already exist.
    AIProfile.__table__.create(bind, checkfirst=True)
    inspector = sa.inspect(bind)
    if "ai_profile_id" not in {c["name"] for c in inspector.get_columns("users")}:
        op.add_column("users", sa.Column("ai_profile_id", sa.String(36), nullable=True))
    columns = {c["name"] for c in inspector.get_columns("chat_messages")}
    for name, length in [("model_label", 220), ("retrieval", 32)]:
        if name not in columns:
            op.add_column("chat_messages", sa.Column(name, sa.String(length), nullable=True))


def downgrade():
    op.drop_column("chat_messages", "retrieval")
    op.drop_column("chat_messages", "model_label")
    op.drop_column("users", "ai_profile_id")
    op.drop_table("ai_profiles")
