"""
SortifyAI — SQLite to Neon PostgreSQL Data Migration Utility

Usage:
1. Ensure DATABASE_URL is set in backend/.env or your terminal:
   DATABASE_URL=postgresql://neondb_owner:password@ep-xxxx.neon.tech/neondb?sslmode=require
2. Run:
   python backend/migrate_to_neon.py
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Load environment variables
load_dotenv()

# Source: Local SQLite
SQLITE_URL = "sqlite:///./backend/sortifyai_v2.db"
# Target: Neon PostgreSQL
NEON_URL = os.getenv("DATABASE_URL")

if not NEON_URL or "sqlite" in NEON_URL:
    print("❌ ERROR: DATABASE_URL environment variable is not set to a PostgreSQL URL.")
    print("Please set your Neon PostgreSQL URL in backend/.env or export DATABASE_URL.")
    sys.exit(1)

if NEON_URL.startswith("postgres://"):
    NEON_URL = NEON_URL.replace("postgres://", "postgresql://", 1)

print("🔗 Connecting to SQLite and Neon PostgreSQL...")

# SQLite Engine
sqlite_engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
SqliteSession = sessionmaker(bind=sqlite_engine)
sqlite_session = SqliteSession()

# Neon Engine
neon_engine = create_engine(NEON_URL, pool_pre_ping=True)
NeonSession = sessionmaker(bind=neon_engine)
neon_session = NeonSession()

from backend.database import Base, File, ChatHistory, Grouping, Feedback, APIKey, APIUsageLog

# 1. Create tables in Neon if they don't exist
print("📦 Creating schema and tables in Neon PostgreSQL...")
Base.metadata.create_all(bind=neon_engine)

def migrate_table(model, name):
    records = sqlite_session.query(model).all()
    count = 0
    for r in records:
        # Create detached copy
        neon_session.merge(r)
        count += 1
    neon_session.commit()
    print(f"✅ Migrated {count} record(s) from {name}")

try:
    migrate_table(File, "files")
    migrate_table(ChatHistory, "chat_history")
    migrate_table(Grouping, "groupings")
    migrate_table(Feedback, "feedback")
    print("\n🎉 Migration completed successfully! Your data is now in Neon PostgreSQL.")
except Exception as e:
    neon_session.rollback()
    print(f"\n❌ Migration error: {e}")
finally:
    sqlite_session.close()
    neon_session.close()
