"""
Alembic environment configuration.

This file is auto-run by Alembic commands (e.g., `alembic upgrade head`).
It is configured to:
  - Read DATABASE_URL from .env / environment
  - Target the SQLAlchemy models defined in this project
  - Support both SQLite (dev) and PostgreSQL (prod)
"""

import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

# ── Allow imports from the backend root ─────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

# Alembic Config object — provides access to the values in alembic.ini
config = context.config

# Override sqlalchemy.url with our environment-driven DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./trade_intelligence.db")
config.set_main_option("sqlalchemy.url", DATABASE_URL)

# Set up Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import Base metadata so Alembic can detect model changes for autogenerate
from database import Base
from models import models  # noqa: F401 — ensures all models are registered
from models import user    # noqa: F401

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations without a live DB connection (generates SQL script)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations with a live DB connection."""
    is_sqlite = DATABASE_URL.startswith("sqlite")
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.StaticPool if is_sqlite else pool.NullPool,
        connect_args={"check_same_thread": False} if is_sqlite else {},
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
