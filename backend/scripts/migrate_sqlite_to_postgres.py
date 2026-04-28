"""
migrate_sqlite_to_postgres.py
─────────────────────────────────────────────────────────────────────────────
One-time data migration: SQLite ──► PostgreSQL

USAGE
  1. Ensure the FastAPI app has been run once against PostgreSQL so that all
     tables exist (Base.metadata.create_all).

  2. Make sure your backend/.env has DATABASE_URL pointing to PostgreSQL:
       DATABASE_URL=postgresql://postgres.xxx:password@host.supabase.com:5432/postgres?sslmode=require

  3. Run from the `backend/` directory:
       python scripts/migrate_sqlite_to_postgres.py

  Safe to re-run — already-existing rows are skipped via ON CONFLICT DO NOTHING.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# Source: SQLite file path
SQLITE_URL = os.getenv("SQLITE_URL", "sqlite:///./trade_intelligence.db")
# Target: always read from DATABASE_URL in .env (never from a separate PG_URL)
PG_URL     = os.getenv("DATABASE_URL", "")
CHUNK_SIZE = 1000  # rows per bulk batch
# ─────────────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("migrate")


def validate_config():
    if not PG_URL or not PG_URL.startswith("postgresql"):
        log.error(
            "DATABASE_URL in backend/.env is not set or is still pointing to SQLite.\n"
            "  Update it to your PostgreSQL URL, e.g.:\n"
            "  DATABASE_URL=postgresql://postgres.xxx:pass@host.supabase.com:5432/postgres?sslmode=require"
        )
        sys.exit(1)


def migrate_table(sqlite_conn, pg_conn, table_name: str):
    """Migrate a single table using true bulk INSERT for maximum speed."""
    log.info("  Migrating table: %s", table_name)

    rows = sqlite_conn.execute(f'SELECT * FROM "{table_name}"').fetchall()
    if not rows:
        log.info("    → 0 rows (empty, skipping)")
        return 0, 0

    # Get column names
    cur = sqlite_conn.execute(f'SELECT * FROM "{table_name}" LIMIT 0')
    columns = [desc[0] for desc in cur.description]

    col_str   = ", ".join(f'"{c}"' for c in columns)
    val_str   = ", ".join(f"%s" for _ in columns)
    sql       = (
        f'INSERT INTO "{table_name}" ({col_str}) '
        f'VALUES ({val_str}) '
        f'ON CONFLICT DO NOTHING'
    )

    inserted = 0
    skipped  = 0
    pg_cur   = pg_conn.cursor()

    for chunk_start in range(0, len(rows), CHUNK_SIZE):
        chunk = rows[chunk_start : chunk_start + CHUNK_SIZE]

        try:
            pg_cur.executemany(sql, [tuple(row) for row in chunk])
            inserted += pg_cur.rowcount if pg_cur.rowcount >= 0 else len(chunk)
            pg_conn.commit()
            log.info(
                "    chunk %d–%d → committed (%d total so far)",
                chunk_start + 1,
                chunk_start + len(chunk),
                inserted,
            )
        except Exception as exc:
            pg_conn.rollback()
            log.warning("    Chunk failed, falling back to row-by-row: %s", exc)
            # Fallback: insert row-by-row to skip individual bad rows
            for row in chunk:
                try:
                    pg_cur.execute(sql, tuple(row))
                    if pg_cur.rowcount > 0:
                        inserted += 1
                    else:
                        skipped += 1
                except Exception:
                    pg_conn.rollback()
                    skipped += 1
            pg_conn.commit()

    pg_cur.close()
    log.info("    → inserted: %d  |  skipped: %d", inserted, skipped)
    return inserted, skipped


def reset_sequences(pg_conn, tables):
    """Reset PostgreSQL auto-increment sequences after bulk load."""
    log.info("Resetting PostgreSQL sequences...")
    cur = pg_conn.cursor()
    for table in tables:
        try:
            cur.execute(
                f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), "
                f"COALESCE((SELECT MAX(id) FROM \"{table}\"), 1))"
            )
        except Exception:
            pg_conn.rollback()
    pg_conn.commit()
    cur.close()


def run_migration():
    validate_config()

    log.info("=" * 60)
    log.info("SQLite → PostgreSQL Migration (Bulk Mode)")
    log.info("  Source : %s", SQLITE_URL)
    log.info("  Target : %s", PG_URL.split("@")[-1])
    log.info("=" * 60)

    import sqlite3
    import psycopg2

    # Connect to SQLite
    sqlite_path = SQLITE_URL.replace("sqlite:///", "").replace("./", "")
    sqlite_conn = sqlite3.connect(sqlite_path)
    sqlite_conn.row_factory = sqlite3.Row

    # Connect to PostgreSQL
    pg_conn = psycopg2.connect(PG_URL)
    pg_conn.autocommit = False

    # Get table lists
    sqlite_tables = [
        r[0] for r in sqlite_conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        ).fetchall()
    ]

    pg_cur = pg_conn.cursor()
    pg_cur.execute(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    )
    pg_tables = [r[0] for r in pg_cur.fetchall()]
    pg_cur.close()

    log.info("SQLite tables : %s", sqlite_tables)
    log.info("Postgres tables: %s", pg_tables)

    tables_to_migrate = [t for t in sqlite_tables if t in pg_tables]
    skipped_tables    = [t for t in sqlite_tables if t not in pg_tables]

    if skipped_tables:
        log.warning("Tables in SQLite but NOT in Postgres (schema not created): %s", skipped_tables)

    # Disable FK triggers during bulk load
    pg_cur = pg_conn.cursor()
    pg_cur.execute("SET session_replication_role = 'replica'")
    pg_conn.commit()
    pg_cur.close()

    total_inserted = 0
    total_skipped  = 0

    for table in tables_to_migrate:
        ins, skp = migrate_table(sqlite_conn, pg_conn, table)
        total_inserted += ins
        total_skipped  += skp

    # Re-enable FK triggers
    pg_cur = pg_conn.cursor()
    pg_cur.execute("SET session_replication_role = 'origin'")
    pg_conn.commit()
    pg_cur.close()

    # Reset sequences
    reset_sequences(pg_conn, tables_to_migrate)

    sqlite_conn.close()
    pg_conn.close()

    log.info("=" * 60)
    log.info("Migration complete!")
    log.info("  Total rows inserted : %d", total_inserted)
    log.info("  Total rows skipped  : %d (already existed)", total_skipped)
    log.info("=" * 60)


if __name__ == "__main__":
    run_migration()
