import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

# Load environment variables (checking current working directory and backend/.env)
load_dotenv()
backend_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=backend_env_path)

# Database setup: Neon PostgreSQL with graceful local fallback
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Local fallback if DATABASE_URL is not configured
    DATABASE_URL = "sqlite:///./sortifyai_v2.db"

# Normalize postgres:// and postgresql:// to postgresql+psycopg2:// for SQLAlchemy compatibility
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

# Configure database engine based on dialect
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
else:
    # Neon Serverless PostgreSQL Configuration
    # pool_pre_ping=True automatically tests connections and reconnects if Neon compute was sleeping
    # pool_recycle=300 recycles connections after 5 minutes to prevent stale idle sockets
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_recycle=300,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class File(Base):
    __tablename__ = "files"
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(String, unique=True, index=True)
    filename = Column(String)
    file_path = Column(String)
    upload_date = Column(DateTime, default=datetime.utcnow)
    total_rows = Column(Integer, default=0)
    data_summary = Column(Text)
    processed = Column(Boolean, default=False)
    
    # Relationships
    chat_history = relationship("ChatHistory", back_populates="file", cascade="all, delete-orphan")
    groupings = relationship("Grouping", back_populates="file", cascade="all, delete-orphan")

class ChatHistory(Base):
    __tablename__ = "chat_history"
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(String, ForeignKey("files.file_id"), nullable=False)
    user_message = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    file = relationship("File", back_populates="chat_history")
    groupings = relationship("Grouping", back_populates="chat")

class Grouping(Base):
    __tablename__ = "groupings"
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(String, ForeignKey("files.file_id"), nullable=False)
    chat_id = Column(Integer, ForeignKey("chat_history.id"), nullable=True)
    rules_json = Column(Text)
    groups_json = Column(Text)
    total_rows = Column(Integer, default=0)
    grouped_rows = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    file = relationship("File", back_populates="groupings")
    chat = relationship("ChatHistory", back_populates="groupings")

class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class APIKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    tier = Column(String, default="developer")  # free, developer, pro, enterprise
    rate_limit_per_min = Column(Integer, default=60)
    requests_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class APIUsageLog(Base):
    __tablename__ = "api_usage_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    api_key_id = Column(Integer, ForeignKey("api_keys.id"), nullable=True)
    endpoint = Column(String, nullable=False)
    status_code = Column(Integer, default=200)
    latency_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=True)
    role = Column(String, default="user") # "user" or "admin"
    google_id = Column(String, unique=True, index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")

class AIConfig(Base):
    __tablename__ = "ai_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String, index=True, nullable=False)  # 'gemini', 'openai', 'github', 'openrouter'
    key_name = Column(String, default="Default Key")
    display_name = Column(String, nullable=False)
    api_key = Column(String, nullable=True)
    model = Column(String, nullable=True)
    base_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=False)
    is_working = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    filename = Column(String, nullable=True)
    total_students = Column(Integer, default=0)
    groups_count = Column(Integer, default=0)
    groups_json = Column(Text, nullable=False)
    file_b64 = Column(Text, nullable=True)
    chat_history_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="projects")

class TesterRequest(Base):
    __tablename__ = "tester_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    organization = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, added
    created_at = Column(DateTime, default=datetime.utcnow)

class AITrainingLog(Base):
    __tablename__ = "ai_training_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_prompt = Column(Text, nullable=False)
    data_summary = Column(Text, nullable=False)
    ai_rules_output = Column(Text, nullable=False)
    resulting_groups_json = Column(Text, nullable=True)
    rating = Column(Integer, nullable=True) # 1-5 for RLHF (Reinforcement Learning from Human Feedback)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables and run safe migrations
def init_db():
    from sqlalchemy import text
    Base.metadata.create_all(bind=engine)
    
    # Safe column additions if table already existed
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user';"))
            conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS file_b64 TEXT;"))
            conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS chat_history_json TEXT;"))
            
            # Create AI training log table if it doesn't exist
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS ai_training_logs (
                    id SERIAL PRIMARY KEY,
                    user_prompt TEXT NOT NULL,
                    data_summary TEXT NOT NULL,
                    ai_rules_output TEXT NOT NULL,
                    resulting_groups_json TEXT,
                    rating INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            conn.commit()
        except Exception as e:
            print("Note on column migrations:", e)
            
    # Seed default AI configs if not present
    db = SessionLocal()
    try:
        existing_count = db.query(AIConfig).count()
        if existing_count == 0:
            default_configs = [
                AIConfig(
                    provider="gemini",
                    display_name="Google Gemini",
                    api_key=os.getenv("GEMINI_API_KEY", ""),
                    model="gemini-1.5-flash",
                    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                    is_active=False
                ),
                AIConfig(
                    provider="openai",
                    display_name="OpenAI (GPT-4o)",
                    api_key=os.getenv("OPENAI_API_KEY", ""),
                    model="gpt-4o-mini",
                    base_url="https://api.openai.com/v1",
                    is_active=False
                ),
                AIConfig(
                    provider="github",
                    display_name="GitHub Models",
                    api_key=os.getenv("GITHUB_TOKEN", os.getenv("GITHUB_MODELS_KEY", "")),
                    model="gpt-4o-mini",
                    base_url="https://models.inference.ai.azure.com",
                    is_active=False
                ),
                AIConfig(
                    provider="openrouter",
                    display_name="OpenRouter",
                    api_key=os.getenv("OPENROUTER_API_KEY", ""),
                    model="openai/gpt-4o-mini",
                    base_url="https://openrouter.ai/api/v1",
                    is_active=True
                )
            ]
            db.add_all(default_configs)
            db.commit()
    except Exception as e:
        print("Note on seeding AI configs:", e)
        db.rollback()
    finally:
        db.close()

# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

