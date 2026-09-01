from alembic import context

from studypilot import models  # noqa: F401
from studypilot.db import Base, get_engine

if context.is_offline_mode():
    context.configure(url=str(get_engine().url), target_metadata=Base.metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()
else:
    with get_engine().connect() as connection:
        context.configure(connection=connection, target_metadata=Base.metadata)
        with context.begin_transaction():
            context.run_migrations()
