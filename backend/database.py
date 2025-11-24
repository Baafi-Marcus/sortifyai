from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

# Database setup
DATABASE_URL = "sqlite:///./sortifyai_v2.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
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

# Create tables
def init_db():
    Base.metadata.create_all(bind=engine)

# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
