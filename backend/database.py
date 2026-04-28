import os
import logging
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("uvicorn")

# ─────────────────────────────────────────────────────────────────────────────
# DATABASE URL
#   Local dev  → SQLite  (set in .env: DATABASE_URL=sqlite:///./trade_intelligence.db)
#   Production → PostgreSQL (set via environment: DATABASE_URL=postgresql://user:pass@host/db)
# ─────────────────────────────────────────────────────────────────────────────
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./trade_intelligence.db"  # safe fallback for local development
)

_is_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")

# ─────────────────────────────────────────────────────────────────────────────
# ENGINE CREATION
# ─────────────────────────────────────────────────────────────────────────────
if _is_sqlite:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},  # required for SQLite + FastAPI threads
    )
    logger.info("Database: using SQLite (local development)")
else:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,   # detect stale connections (important for PostgreSQL)
        pool_size=5,          # Supabase Nano cap = 15 total — keep this at 5
        max_overflow=8,       # max extra = 8 → total ceiling = 13 (safely under 15)
    )
    logger.info("Database: using PostgreSQL (production)")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency: yields a SQLAlchemy DB session and ensures it is closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
