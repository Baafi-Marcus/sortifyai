import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE ai_configs DROP CONSTRAINT IF EXISTS ix_ai_configs_provider;"))
        print("Dropped ix_ai_configs_provider (constraint)")
    except Exception as e:
        print(e)
        
    try:
        conn.execute(text("DROP INDEX IF EXISTS ix_ai_configs_provider;"))
        print("Dropped index ix_ai_configs_provider")
    except Exception as e:
        print(e)
        
    try:
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_configs_provider ON ai_configs (provider);"))
        print("Created non-unique index")
    except Exception as e:
        print(e)

    try:
        conn.execute(text("ALTER TABLE ai_configs DROP CONSTRAINT IF EXISTS ai_configs_provider_key;"))
        print("Dropped ai_configs_provider_key constraint")
    except Exception as e:
        print(e)

    try:
        conn.execute(text("ALTER TABLE ai_configs ADD COLUMN IF NOT EXISTS key_name VARCHAR DEFAULT 'Default Key';"))
        print("Added key_name")
    except Exception as e:
        print(e)

    try:
        conn.execute(text("ALTER TABLE ai_configs ADD COLUMN IF NOT EXISTS is_working BOOLEAN DEFAULT true;"))
        print("Added is_working")
    except Exception as e:
        print(e)

    conn.commit()
    print("Migration complete!")
