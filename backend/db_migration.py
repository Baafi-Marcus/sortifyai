import sqlite3

def run_migration():
    conn = sqlite3.connect('sortifyai_v2.db')
    c = conn.cursor()
    c.execute("SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name='ai_configs'")
    indexes = c.fetchall()
    print("Indexes before:", indexes)
    
    # Check if there is a unique index on provider
    try:
        c.execute("DROP INDEX IF EXISTS ix_ai_configs_provider")
        c.execute("CREATE INDEX ix_ai_configs_provider ON ai_configs (provider)")
    except Exception as e:
        print("Error changing index:", e)

    # Add new columns
    try:
        c.execute("ALTER TABLE ai_configs ADD COLUMN key_name VARCHAR DEFAULT 'Default Key'")
    except Exception as e:
        print("Add key_name:", e)
        
    try:
        c.execute("ALTER TABLE ai_configs ADD COLUMN is_working BOOLEAN DEFAULT 1")
    except Exception as e:
        print("Add is_working:", e)
        
    conn.commit()
    conn.close()
    print("Migration done")

if __name__ == '__main__':
    run_migration()
