import os
import sys

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
import shutil
import uuid
import pandas as pd
import json
import re
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from jose import jwt, JWTError
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

import bcrypt

from data_engine import DataExtractor
from ai_engine import AIGroupingAgent
from optimization_engine import OptimizationEngine
from database import init_db, get_db, SessionLocal, File as DBFile, ChatHistory, Grouping, Feedback, APIKey, APIUsageLog, User, Project, TesterRequest, AIConfig
from whatsapp_service import send_feedback_notification

security = HTTPBearer(auto_error=False)
JWT_SECRET = os.getenv("JWT_SECRET", "sortifyai-secret-jwt-key-2026-secure")
JWT_ALGORITHM = "HS256"
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
ADMIN_KEY = os.getenv("ADMIN_KEY", "sortifyadmin2026")

app = FastAPI(
    title="SortifyAI Platform Engine API",
    description="Intelligent AI-Powered Allocation, Grouping, and Optimization Engine for education, business, and enterprise workflows.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://sortify-ai.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

# Initialize engines
data_extractor = DataExtractor()
ai_agent = AIGroupingAgent()
optimization_engine = OptimizationEngine()

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

# Request Models
class GroupingRequest(BaseModel):
    file_id: str
    instructions: str

class InterpretRequest(BaseModel):
    file_id: str
    instructions: str

class V2OptimizationRequest(BaseModel):
    file_id: Optional[str] = None
    data: Optional[List[Dict[str, Any]]] = None
    instructions: Optional[str] = "Divide into balanced groups"
    num_groups: Optional[int] = 10
    constraints: Optional[Dict[str, Any]] = None

class V2ValidateRequest(BaseModel):
    groups: List[Dict[str, Any]]
    constraints: Dict[str, Any]

class CreateAPIKeyRequest(BaseModel):
    name: str
    tier: Optional[str] = "developer"

class CheckGroupsRequest(BaseModel):
    file_id: str
    group_column: str = None

class FeedbackRequest(BaseModel):
    name: str = None
    email: str = None
    rating: int
    message: str

class GoogleLoginRequest(BaseModel):
    credential: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    google_id: Optional[str] = None

class TesterSignupRequest(BaseModel):
    email: str
    name: Optional[str] = None
    organization: Optional[str] = None

class UserRegisterRequest(BaseModel):
    username: str
    password: str
    confirm_password: str
    email: str
    name: Optional[str] = None

class UserLoginRequest(BaseModel):
    identifier: str  # username or email
    password: str

class SaveAIConfigRequest(BaseModel):
    id: Optional[int] = None
    provider: str  # 'gemini', 'openai', 'github', 'openrouter'
    key_name: Optional[str] = "Default Key"
    api_key: str
    model: Optional[str] = None
    base_url: Optional[str] = None
    is_active: Optional[bool] = False

class TestAIConfigRequest(BaseModel):
    provider: str
    api_key: str
    model: str
    base_url: Optional[str] = None

class ChatMessageRequest(BaseModel):
    file_id: str
    message: str

class SaveProjectRequest(BaseModel):
    title: str
    filename: Optional[str] = None
    total_students: Optional[int] = 0
    groups_count: Optional[int] = 0
    groups_data: List[Dict[str, Any]]

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode('utf-8')[:72]
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False

def validate_strong_password(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter (A-Z).")
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter (a-z).")
    if not re.search(r"[0-9]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number (0-9).")
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\",.<>/?\\|`~]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character (!@#$%^&*...).")

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        return db.query(User).filter(User.id == int(user_id)).first()
    except (JWTError, ValueError):
        return None

def compute_group_analytics(items: List[dict]) -> dict:
    """Computes distribution and score analytics for a group of students."""
    if not items:
        return {
            "count": 0,
            "avg_score": None,
            "min_score": None,
            "max_score": None,
            "gender_distribution": {},
            "programme_distribution": {}
        }
    
    count = len(items)
    score_col = None
    gender_col = None
    prog_col = None
    
    first_item = items[0]
    for key in first_item.keys():
        k = str(key).lower()
        if not score_col and any(w in k for w in ['score', 'mark', 'grade', 'total', 'average', 'gpa', 'point']):
            score_col = key
        if not gender_col and any(w in k for w in ['gender', 'sex']):
            gender_col = key
        if not prog_col and any(w in k for w in ['prog', 'course', 'track', 'class', 'dept', 'department', 'major', 'subject']):
            prog_col = key
            
    scores = []
    if score_col:
        for it in items:
            val = it.get(score_col)
            try:
                if val is not None and str(val).strip():
                    scores.append(float(str(val).replace(',', '').replace('$', '').strip()))
            except (ValueError, TypeError):
                pass
                
    avg_score = round(sum(scores) / len(scores), 1) if scores else None
    min_score = min(scores) if scores else None
    max_score = max(scores) if scores else None
    
    gender_dist = {}
    if gender_col:
        for it in items:
            val = str(it.get(gender_col, 'Unknown')).strip().capitalize()
            if val.lower() in ['m', 'male', 'boy']: val = 'Male'
            elif val.lower() in ['f', 'female', 'girl']: val = 'Female'
            gender_dist[val] = gender_dist.get(val, 0) + 1
            
    prog_dist = {}
    if prog_col:
        for it in items:
            val = str(it.get(prog_col, 'Other')).strip()
            if val and val != "None":
                prog_dist[val] = prog_dist.get(val, 0) + 1
                
    return {
        "count": count,
        "avg_score": avg_score,
        "min_score": min_score,
        "max_score": max_score,
        "gender_distribution": gender_dist,
        "programme_distribution": prog_dist
    }

@app.get("/")
def read_root():
    return {"message": "SortifyAI Backend is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "SortifyAI Backend"}


def process_file_background(file_id: str, file_path: str):
    """Background task to process file and update database"""
    db = SessionLocal()
    try:
        print(f"Background processing started for {file_id}")
        # Extract data
        data = data_extractor.load_data(file_path)
        
        # Analyze structure
        structure_summary = ai_agent.analyze_structure(data)
        
        # Get row count
        if isinstance(data, pd.DataFrame):
            total_rows = len(data)
        else:
            total_rows = len(data) if isinstance(data, list) else 0
            
        # Update database
        db_file = db.query(DBFile).filter(DBFile.file_id == file_id).first()
        if db_file:
            db_file.total_rows = total_rows
            db_file.data_summary = structure_summary
            db_file.processed = True
            db.commit()
            print(f"Background processing complete for {file_id}")
            
    except Exception as e:
        print(f"Error in background processing for {file_id}: {e}")
        try:
            db_file = db.query(DBFile).filter(DBFile.file_id == file_id).first()
            if db_file:
                db_file.data_summary = f"Error processing file: {str(e)}"
                db_file.processed = True
                db.commit()
        except Exception as db_err:
            print(f"Failed to record processing error for {file_id}: {db_err}")
    finally:
        db.close()

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...), 
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    print(f"DEBUG: Upload endpoint called with file: {file.filename}")
    file_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    file_path = f"uploads/{file_id}{file_extension}"
    
    try:
        # Save file to permanent storage
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Immediate inspection for instant preview & health checks
        preview = []
        columns = []
        issues = []
        total_rows = 0
        data_summary = "Processing..."
        is_processed = False

        try:
            data = data_extractor.load_data(file_path)
            if isinstance(data, pd.DataFrame):
                total_rows = len(data)
                columns = [str(c) for c in data.columns]
                preview = data.head(8).fillna("").to_dict(orient="records")
                
                # Check for health issues
                null_counts = data.isnull().sum()
                for col, count in null_counts.items():
                    if count > 0:
                        issues.append(f"{count} students have missing values in '{col}'")
                
                id_cols = [c for c in data.columns if any(k in str(c).lower() for k in ['id', 'student', 'roll', 'index', 'number'])]
                for col in id_cols:
                    dupes = int(data[col].duplicated().sum())
                    if dupes > 0:
                        issues.append(f"{dupes} duplicate values detected in '{col}'")
                
                if not issues:
                    issues.append(f"All {total_rows} records are clean and ready to process.")
                
                data_summary = ai_agent.analyze_structure(data)
                is_processed = True
        except Exception as quick_err:
            print(f"Instant preview extraction warning: {quick_err}")

        # Create initial DB record
        db_file = DBFile(
            file_id=file_id,
            filename=file.filename,
            file_path=file_path,
            total_rows=total_rows, 
            data_summary=data_summary,
            processed=is_processed
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        
        # Schedule background processing if needed
        if not is_processed and background_tasks:
            background_tasks.add_task(process_file_background, file_id, file_path)
        
        return {
            "file_id": file_id,
            "filename": file.filename,
            "summary": data_summary,
            "total_rows": total_rows,
            "columns": columns,
            "preview": preview,
            "issues": issues,
            "status": "ready" if is_processed else "processing"
        }
    except Exception as e:
        print(f"Error during upload: {e}")
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/group")
async def group_data(
    request: GroupingRequest, 
    db: Session = Depends(get_db)
):
    # Get file from database
    db_file = db.query(DBFile).filter(DBFile.file_id == request.file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
        
    # Check if processing is complete
    if not db_file.processed:
        return {
            "groups": [],
            "explanation": "File is still being processed. Please try again in a moment.",
            "total_rows": 0,
            "grouped_rows": 0,
            "all_included": False,
            "status": "processing"
        }
    
    try:
        # Load data from file
        data = data_extractor.load_data(db_file.file_path)
        data_summary = db_file.data_summary
        
        # Get grouping RULES from AI
        grouping_rules_json = ai_agent.interpret_instructions(data_summary, request.instructions)
        
        # Parse JSON
        json_match = re.search(r'```json\n(.*?)\n```', grouping_rules_json, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            json_str = grouping_rules_json
            
        rules = json.loads(json_str)
        
        # Check if the AI returned an error
        if "error" in rules:
            error_msg = rules.get("explanation", "Failed to generate grouping rules")
            print(f"AI Error: {rules.get('error')}")
            raise HTTPException(
                status_code=500, 
                detail=f"AI grouping failed: {error_msg}"
            )
        
        # Apply rules to ALL rows in the dataset
        if isinstance(data, pd.DataFrame):
            groups_with_data = ai_agent.apply_rules_to_data(data, json_str)
        else:
            groups_with_data = rules.get("groups", [])
        
        # Count total rows
        total_rows = db_file.total_rows
        grouped_count = sum(len(group.get("items", [])) for group in groups_with_data)
        
        # Save chat history
        chat = ChatHistory(
            file_id=request.file_id,
            user_message=request.instructions,
            ai_response=rules.get("explanation", "")
        )
        db.add(chat)
        db.commit()
        db.refresh(chat)
        
        # Save grouping
        grouping = Grouping(
            file_id=request.file_id,
            chat_id=chat.id,
            rules_json=json_str,
            groups_json=json.dumps(groups_with_data),
            total_rows=total_rows,
            grouped_rows=grouped_count
        )
        db.add(grouping)
        db.commit()
        
        # Attach analytics to each group
        for group in groups_with_data:
            group["analytics"] = compute_group_analytics(group.get("items", []))

        # Make AI reasoning / decision criteria visible
        instr = request.instructions.lower()
        decision_summary = {
            "primary": "Academic score" if any(k in instr for k in ["score", "academic", "performance", "mark"]) else "Balanced Headcount",
            "secondary": "Programme mix" if any(k in instr for k in ["prog", "programme", "course", "subject"]) else "Dataset Distribution",
            "balance": "Gender ratio" if any(k in instr for k in ["gender", "sex", "male", "female"]) else "Equal Group Size",
            "group_count": len(groups_with_data)
        }
        
        return {
            "groups": groups_with_data,
            "explanation": rules.get("explanation", ""),
            "decision_summary": decision_summary,
            "total_rows": total_rows,
            "grouped_rows": grouped_count,
            "all_included": grouped_count == total_rows
        }
    except Exception as e:
        print(f"Grouping error: {e}")
        raise HTTPException(status_code=500, detail=f"Grouping failed: {str(e)}")

@app.get("/files/{file_id}/preview")
async def get_file_preview(file_id: str, db: Session = Depends(get_db)):
    """Returns columns, first rows preview, and health checks for a file."""
    db_file = db.query(DBFile).filter(DBFile.file_id == file_id).first()
    if not db_file or not os.path.exists(db_file.file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        data = data_extractor.load_data(db_file.file_path)
        if isinstance(data, pd.DataFrame):
            columns = [str(c) for c in data.columns]
            preview = data.head(10).fillna("").to_dict(orient="records")
            null_counts = data.isnull().sum()
            issues = [f"{count} students have missing '{col}'" for col, count in null_counts.items() if count > 0]
            
            id_cols = [c for c in data.columns if any(k in str(c).lower() for k in ['id', 'student', 'roll', 'index', 'number'])]
            for col in id_cols:
                dupes = int(data[col].duplicated().sum())
                if dupes > 0:
                    issues.append(f"{dupes} duplicate IDs in '{col}'")
                    
            if not issues:
                issues.append(f"All {len(data)} records are clean and ready to process.")
                
            return {
                "file_id": file_id,
                "filename": db_file.filename,
                "total_rows": len(data),
                "columns": columns,
                "preview": preview,
                "issues": issues,
                "processed": db_file.processed
            }
        return {"file_id": file_id, "filename": db_file.filename, "total_rows": 0, "columns": [], "preview": [], "issues": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/interpret")
async def interpret_request(
    request: InterpretRequest,
    db: Session = Depends(get_db)
):
    """
    Step 3: Signature 'What do you want?' interpretation & pre-confirmation.
    Shows the user what the AI understood before generating groups.
    """
    db_file = db.query(DBFile).filter(DBFile.file_id == request.file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
        
    instr = request.instructions.lower()
    
    # Extract group count
    group_count_match = re.search(r'(\d+)\s*(?:groups?|teams?|houses?|clusters?)', instr)
    group_count = int(group_count_match.group(1)) if group_count_match else 10
    total_records = db_file.total_rows or 100
    avg_per_grp = max(1, total_records // group_count)
    
    # Interpret bullet points
    summary_points = [
        f"{group_count} groups with similar group sizes (~{avg_per_grp} students each)"
    ]
    
    if any(k in instr for k in ['gender', 'sex', 'male', 'female', 'boy', 'girl', 'balance']):
        summary_points.append("Balance gender ratio evenly across all groups")
    if any(k in instr for k in ['prog', 'programme', 'course', 'track', 'subject', 'mix', 'different']):
        summary_points.append("Mix students from different programmes into each group")
    if any(k in instr for k in ['score', 'performance', 'academic', 'mark', 'high', 'low', 'similar']):
        summary_points.append("Distribute academic performance bands evenly")
    if any(k in instr for k in ['together', 'keep', 'pair']):
        summary_points.append("Keep designated student pairs together")
    if any(k in instr for k in ['separate', 'apart', 'different group']):
        summary_points.append("Ensure designated students are placed into separate groups")
        
    if len(summary_points) == 1:
        summary_points.append("Balanced and diverse allocation across all detected attributes")

    decision_summary = {
        "primary": "Academic score" if any(k in instr for k in ["score", "academic", "mark"]) else "Balanced Headcount",
        "secondary": "Programme diversity" if any(k in instr for k in ["prog", "programme", "course"]) else "Random Distribution",
        "balance": "Gender (50/50)" if any(k in instr for k in ["gender", "sex"]) else "Equal Group Size",
        "group_count": group_count
    }
    
    return {
        "interpreted_as": summary_points,
        "criteria": decision_summary,
        "group_count": group_count,
        "ready": True
    }

@app.post("/check-groups")
async def check_existing_groups(
    request: CheckGroupsRequest,
    db: Session = Depends(get_db)
):
    """
    Point 19: Check My Groups - Evaluates if pre-existing groups in a spreadsheet are balanced.
    """
    db_file = db.query(DBFile).filter(DBFile.file_id == request.file_id).first()
    if not db_file or not os.path.exists(db_file.file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    data = data_extractor.load_data(db_file.file_path)
    if not isinstance(data, pd.DataFrame):
        raise HTTPException(status_code=400, detail="Check My Groups requires tabular data (CSV/Excel)")
        
    group_col = request.group_column
    if not group_col:
        for c in data.columns:
            if any(k in str(c).lower() for k in ['group', 'house', 'team', 'cluster', 'class', 'section']):
                group_col = c
                break
                
    if not group_col or group_col not in data.columns:
        raise HTTPException(status_code=400, detail="Could not find an existing 'Group' column to analyze. Please specify the column name.")
        
    grouped = data.groupby(group_col)
    group_sizes = grouped.size().tolist()
    size_variance = max(group_sizes) - min(group_sizes) if group_sizes else 0
    size_status = "Good" if size_variance <= 4 else "Needs Adjustment"
    
    # Check gender balance
    gender_col = next((c for c in data.columns if any(k in str(c).lower() for k in ['gender', 'sex'])), None)
    gender_status = "Good"
    gender_insights = []
    if gender_col:
        ratios = []
        for _, grp in grouped:
            g_counts = grp[gender_col].value_counts(normalize=True)
            fem_ratio = g_counts.get('Female', g_counts.get('F', 0.5))
            ratios.append(fem_ratio)
        if ratios and (max(ratios) - min(ratios)) > 0.25:
            gender_status = "Needs Adjustment"
            gender_insights.append("Gender skew detected: some groups have noticeably more male or female students.")
        else:
            gender_insights.append("Gender ratio is evenly balanced across groups.")
            
    # Check score balance
    score_col = next((c for c in data.columns if any(k in str(c).lower() for k in ['score', 'mark', 'grade'])), None)
    score_status = "Good"
    if score_col:
        means = []
        for _, grp in grouped:
            numeric_scores = pd.to_numeric(grp[score_col], errors='coerce').dropna()
            if len(numeric_scores) > 0:
                means.append(numeric_scores.mean())
        if means and (max(means) - min(means)) > 15:
            score_status = "Needs Adjustment"
            
    return {
        "group_column": group_col,
        "total_groups": len(grouped),
        "total_students": len(data),
        "report": {
            "group_size": size_status,
            "gender_balance": gender_status,
            "academic_balance": score_status,
            "insights": gender_insights or ["All groups meet baseline balance metrics."]
        }
    }

@app.get("/files")
async def list_files(db: Session = Depends(get_db)):
    """List all uploaded files"""
    files = db.query(DBFile).order_by(DBFile.upload_date.desc()).all()
    return {
        "files": [
            {
                "file_id": f.file_id,
                "filename": f.filename,
                "upload_date": f.upload_date.isoformat(),
                "total_rows": f.total_rows,
                "processed": f.processed
            }
            for f in files
        ]
    }

@app.get("/chat-history/{file_id}")
async def get_chat_history(file_id: str, db: Session = Depends(get_db)):
    """Get chat history for a specific file"""
    db_file = db.query(DBFile).filter(DBFile.file_id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    chats = db.query(ChatHistory).filter(ChatHistory.file_id == file_id).order_by(ChatHistory.timestamp.asc()).all()
    return {
        "file_id": file_id,
        "filename": db_file.filename,
        "total_rows": db_file.total_rows,
        "chat_history": [
            {
                "id": chat.id,
                "user_message": chat.user_message,
                "ai_response": chat.ai_response,
                "timestamp": chat.timestamp.isoformat()
            }
            for chat in chats
        ]
    }

def is_grouping_request(prompt: str) -> bool:
    prompt_l = prompt.lower()
    grouping_keywords = [
        "group", "divide", "allocate", "split", "cohort", "house", 
        "teams", "cluster", "categorize into", "sort into",
        "make groups", "create groups", "partition", "distribute into"
    ]
    return any(k in prompt_l for k in grouping_keywords)

@app.post("/chat", summary="Natural Language Chat about an Uploaded File")
async def chat_endpoint(req: ChatMessageRequest, db: Session = Depends(get_db)):
    """Conversational endpoint: answers questions about the file or executes grouping instructions."""
    db_file = db.query(DBFile).filter(DBFile.file_id == req.file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File session not found.")

    try:
        data = data_extractor.load_data(db_file.file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load file data: {str(e)}")

    user_msg = req.message.strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # Check if the user intends to group the file
    if is_grouping_request(user_msg):
        data_summary = db_file.data_summary or (ai_agent.analyze_structure(data) if data is not None else "")
        grouping_rules_json = ai_agent.interpret_instructions(data_summary, user_msg)

        json_match = re.search(r'```json\n(.*?)\n```', grouping_rules_json, re.DOTALL)
        json_str = json_match.group(1) if json_match else grouping_rules_json
        
        try:
            rules = json.loads(json_str)
        except Exception:
            rules = {"groups": [], "explanation": grouping_rules_json}

        if "error" in rules and not rules.get("groups"):
            error_msg = rules.get("explanation", "Failed to generate grouping rules")
            raise HTTPException(status_code=500, detail=f"AI grouping failed: {error_msg}")

        if isinstance(data, pd.DataFrame):
            groups_with_data = ai_agent.apply_rules_to_data(data, json_str)
        else:
            groups_with_data = rules.get("groups", [])

        grouped_count = sum(len(group.get("items", [])) for group in groups_with_data)

        # Save to chat history
        chat = ChatHistory(
            file_id=req.file_id,
            user_message=user_msg,
            ai_response=rules.get("explanation", "Groups created according to your instructions.")
        )
        db.add(chat)
        db.commit()
        db.refresh(chat)

        # Save grouping
        grouping = Grouping(
            file_id=req.file_id,
            chat_id=chat.id,
            rules_json=json_str,
            groups_json=json.dumps(groups_with_data),
            total_rows=db_file.total_rows,
            grouped_rows=grouped_count
        )
        db.add(grouping)
        db.commit()

        for group in groups_with_data:
            group["analytics"] = compute_group_analytics(group.get("items", []))

        return {
            "status": "success",
            "is_grouping": True,
            "reply": rules.get("explanation", "I have organized your data into balanced groups according to your instructions."),
            "groups": groups_with_data,
            "total_rows": db_file.total_rows,
            "grouped_rows": grouped_count
        }

    # General Question about the file
    past_chats = db.query(ChatHistory).filter(ChatHistory.file_id == req.file_id).order_by(ChatHistory.timestamp.desc()).limit(6).all()
    history = []
    for c in reversed(past_chats):
        history.append({"role": "user", "content": c.user_message})
        history.append({"role": "assistant", "content": c.ai_response})

    ai_reply = ai_agent.answer_file_question(data, user_msg, conversation_history=history)

    # Save to chat history
    chat = ChatHistory(
        file_id=req.file_id,
        user_message=user_msg,
        ai_response=ai_reply
    )
    db.add(chat)
    db.commit()

    return {
        "status": "success",
        "is_grouping": False,
        "reply": ai_reply,
        "groups": None
    }

@app.delete("/files/{file_id}", summary="Delete a File and its Chat History")
async def delete_file_endpoint(file_id: str, db: Session = Depends(get_db)):
    """Deletes an uploaded file and all associated chat history."""
    db_file = db.query(DBFile).filter(DBFile.file_id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        if db_file.file_path and os.path.exists(db_file.file_path):
            os.remove(db_file.file_path)
    except Exception as e:
        print("Note removing file from disk:", e)
        
    db.delete(db_file)
    db.commit()
    return {"status": "success", "message": "File and chat session removed."}

@app.get("/groupings/{file_id}")
async def get_groupings(file_id: str, db: Session = Depends(get_db)):
    """Get all groupings for a specific file"""
    db_file = db.query(DBFile).filter(DBFile.file_id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    groupings = db.query(Grouping).filter(Grouping.file_id == file_id).order_by(Grouping.created_at.desc()).all()
    return {
        "groupings": [
            {
                "id": g.id,
                "groups": json.loads(g.groups_json),
                "total_rows": g.total_rows,
                "grouped_rows": g.grouped_rows,
                "created_at": g.created_at.isoformat()
            }
            for g in groupings
        ]
    }


@app.post("/feedback")
async def submit_feedback(feedback: FeedbackRequest, db: Session = Depends(get_db)):
    """Submit user feedback"""
    new_feedback = Feedback(
        name=feedback.name,
        email=feedback.email,
        rating=feedback.rating,
        message=feedback.message
    )
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)
    
    # Send WhatsApp notification (non-blocking)
    try:
        send_feedback_notification(
            name=feedback.name,
            email=feedback.email,
            rating=feedback.rating,
            message=feedback.message
        )
    except Exception as e:
        print(f"WhatsApp notification failed: {e}")
        # Don't fail the request if WhatsApp fails
    
    return {"message": "Thank you for your feedback!", "id": new_feedback.id}

@app.get("/feedback")
async def get_all_feedback(db: Session = Depends(get_db)):
    """Get all feedback (for admin review)"""
    feedbacks = db.query(Feedback).order_by(Feedback.created_at.desc()).all()
    return {
        "feedback": [
            {
                "id": f.id,
                "name": f.name,
                "email": f.email,
                "rating": f.rating,
                "message": f.message,
                "created_at": f.created_at.isoformat()
            }
            for f in feedbacks
        ]
    }

# ==========================================
# SortifyAI V2 — Platform Engine & API Core
# ==========================================

@app.post("/v2/optimize", summary="Core Allocation & Multi-Objective Optimization Engine")
@app.post("/api/v2/optimize", include_in_schema=False)
async def v2_optimize_endpoint(req: V2OptimizationRequest, db: Session = Depends(get_db)):
    """
    SortifyAI Core V2 Engine Contract:
    Accepts: DATA (or file_id) + USER INSTRUCTIONS + CONSTRAINTS + NUMBER OF GROUPS
    Returns: GROUPS + STATISTICS + VALIDATION + EXPLANATION
    """
    records = []
    
    # 1. Acquire records from raw payload or uploaded file
    if req.data:
        records = req.data
    elif req.file_id:
        db_file = db.query(DBFile).filter(DBFile.file_id == req.file_id).first()
        if not db_file:
            raise HTTPException(status_code=404, detail="File ID not found.")
        try:
            df = data_extractor.load_data(db_file.file_path)
            if isinstance(df, pd.DataFrame):
                records = df.to_dict(orient="records")
            elif isinstance(df, list):
                records = [{"text": line} for line in df]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read file data: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Either 'data' array or 'file_id' must be provided.")

    if not records:
        raise HTTPException(status_code=400, detail="Dataset contains 0 records.")

    # 2. Execute deterministic multi-objective optimization & balancing
    result = optimization_engine.allocate_balanced_groups(
        records=records,
        num_groups=req.num_groups or 10,
        constraints=req.constraints
    )
    
    return result

@app.post("/v2/validate", summary="Validate Grouping Constraints & Balance Score")
@app.post("/api/v2/validate", include_in_schema=False)
async def v2_validate_endpoint(req: V2ValidateRequest):
    """Validates allocations against hard and soft constraints."""
    return optimization_engine.validate_constraints(
        groups=req.groups,
        constraints=req.constraints
    )

@app.post("/v2/api-keys", summary="Generate a Developer API Key")
@app.post("/api/v2/api-keys", include_in_schema=False)
async def create_api_key(req: CreateAPIKeyRequest, db: Session = Depends(get_db)):
    """Generates a developer API key for external platform integration."""
    new_key = f"sk_live_{uuid.uuid4().hex}"
    api_key_record = APIKey(
        key=new_key,
        name=req.name,
        tier=req.tier or "developer",
        rate_limit_per_min=120 if req.tier in ["pro", "enterprise"] else 60
    )
    db.add(api_key_record)
    db.commit()
    db.refresh(api_key_record)
    return {
        "status": "success",
        "api_key": new_key,
        "name": api_key_record.name,
        "tier": api_key_record.tier,
        "rate_limit_per_min": api_key_record.rate_limit_per_min,
        "created_at": api_key_record.created_at.isoformat()
    }

# ==========================================
# Google Authentication & Project Cloud Sync
# ==========================================

@app.post("/auth/google", summary="Google One-Tap / OAuth Sign-In")
async def google_login(req: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Authenticates or signs up a user via Google Identity Services."""
    google_data = {}
    
    if req.credential:
        try:
            if GOOGLE_CLIENT_ID:
                id_info = google_id_token.verify_oauth2_token(
                    req.credential, 
                    google_requests.Request(), 
                    GOOGLE_CLIENT_ID
                )
            else:
                id_info = jwt.get_unverified_claims(req.credential)
                
            google_data = {
                "google_id": id_info.get("sub"),
                "email": id_info.get("email"),
                "name": id_info.get("name") or id_info.get("email", "").split("@")[0],
                "avatar_url": id_info.get("picture")
            }
        except Exception as e:
            if not req.email:
                raise HTTPException(status_code=400, detail=f"Invalid Google credential: {str(e)}")
            google_data = {
                "google_id": req.google_id,
                "email": req.email,
                "name": req.name or req.email.split("@")[0],
                "avatar_url": req.avatar_url
            }
    elif req.email:
        google_data = {
            "google_id": req.google_id,
            "email": req.email,
            "name": req.name or req.email.split("@")[0],
            "avatar_url": req.avatar_url
        }
    else:
        raise HTTPException(status_code=400, detail="Missing Google credential or email.")

    if not google_data.get("email"):
        raise HTTPException(status_code=400, detail="Could not determine email from Google account.")

    # Find or create user in Neon PostgreSQL
    user = db.query(User).filter(
        (User.email == google_data["email"]) | 
        (User.google_id == google_data.get("google_id"))
    ).first()

    if not user:
        user = User(
            email=google_data["email"],
            name=google_data.get("name") or "User",
            google_id=google_data.get("google_id"),
            avatar_url=google_data.get("avatar_url")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if google_data.get("avatar_url"):
            user.avatar_url = google_data["avatar_url"]
        if google_data.get("name"):
            user.name = google_data["name"]
        db.commit()
        db.refresh(user)

    session_token = create_access_token({"sub": str(user.id), "email": user.email})

    return {
        "status": "success",
        "token": session_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url
        }
    }

@app.get("/auth/google/callback", summary="Google OAuth Web Server Redirect Callback")
async def google_oauth_callback():
    """Handles web server redirect flow if triggered by browser redirect."""
    frontend_url = os.getenv("FRONTEND_URL", "https://sortify-ai.vercel.app")
    return RedirectResponse(url=frontend_url)

@app.get("/auth/me", summary="Get Current Authenticated User Profile")
async def get_current_user_profile(
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns profile and project statistics of logged in user."""
    if not user:
        return {"authenticated": False, "user": None}
    
    saved_projects_count = db.query(Project).filter(Project.user_id == user.id).count()
    return {
        "authenticated": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url,
            "saved_projects_count": saved_projects_count
        }
    }

@app.post("/auth/request-tester", summary="Submit Gmail to join Google OAuth Tester Whitelist")
async def request_tester_access(req: TesterSignupRequest, db: Session = Depends(get_db)):
    """Collects tester email to be added to Google OAuth Console testing list."""
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="A valid email address is required.")
    
    existing = db.query(TesterRequest).filter(TesterRequest.email == email).first()
    if existing:
        if req.name:
            existing.name = req.name
        if req.organization:
            existing.organization = req.organization
        db.commit()
        return {
            "status": "success",
            "message": "Your email is already registered on the Google OAuth tester whitelist queue."
        }
    
    record = TesterRequest(
        email=email,
        name=req.name or email.split("@")[0],
        organization=req.organization,
        status="pending"
    )
    db.add(record)
    db.commit()
    return {
        "status": "success",
        "message": f"Successfully registered {email} for the Google OAuth testing whitelist."
    }

@app.get("/auth/testers", summary="Get all submitted tester emails (Admin / Developer)")
async def get_testers(db: Session = Depends(get_db)):
    """Returns all requested tester emails formatted for quick copy-paste into Google Console."""
    testers = db.query(TesterRequest).order_by(TesterRequest.created_at.desc()).all()
    emails = [t.email for t in testers]
    return {
        "count": len(testers),
        "comma_separated_emails": ", ".join(emails),
        "testers": [
            {
                "id": t.id,
                "email": t.email,
                "name": t.name,
                "organization": t.organization,
                "status": t.status,
                "created_at": t.created_at.isoformat() if t.created_at else None
            }
            for t in testers
        ]
    }

@app.post("/auth/email-login", summary="Direct Passwordless Email Sign-In / Account Creation")
async def email_login(req: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Allows instant sign-in or signup via email without waiting for Google OAuth whitelist."""
    email = (req.email or "").strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="A valid email address is required.")
    
    name = req.name or email.split("@")[0]
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            name=name,
            avatar_url=req.avatar_url or f"https://api.dicebear.com/7.x/initials/svg?seed={name}"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Also auto-register in tester_requests if it's a gmail address
    if "gmail" in email or "googlemail" in email:
        existing_tr = db.query(TesterRequest).filter(TesterRequest.email == email).first()
        if not existing_tr:
            db.add(TesterRequest(email=email, name=name, status="pending"))
            db.commit()
    
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "status": "success",
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "name": user.name,
            "role": user.role or "user",
            "avatar_url": user.avatar_url
        }
    }

# ==========================================
# Username & Strong Password Authentication
# ==========================================

@app.post("/auth/register", summary="Register with Username, Strong Password, and Email")
async def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
    """Registers a new user with verified strong password and saves email for future Google sync."""
    username = req.username.strip().lower()
    email = req.email.strip().lower()

    if not username or len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters long.")
    if not re.match(r"^[a-zA-Z0-9_-]+$", username):
        raise HTTPException(status_code=400, detail="Username can only contain letters, numbers, underscores, and hyphens.")

    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")

    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match. Please confirm your password.")

    validate_strong_password(req.password)

    # Check uniqueness
    existing_user = db.query(User).filter(
        (User.username == username) | (User.email == email)
    ).first()
    if existing_user:
        if existing_user.username == username:
            raise HTTPException(status_code=400, detail=f"Username '{username}' is already taken. Please choose another.")
        if existing_user.email == email:
            raise HTTPException(status_code=400, detail=f"Email '{email}' is already registered. Please sign in instead.")

    display_name = req.name.strip() if req.name else username
    hashed_pwd = hash_password(req.password)

    new_user = User(
        username=username,
        email=email,
        name=display_name,
        password_hash=hashed_pwd,
        role="user",
        avatar_url=f"https://api.dicebear.com/7.x/initials/svg?seed={username}"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Automatically save email into tester_requests for future Google OAuth migration
    existing_tr = db.query(TesterRequest).filter(TesterRequest.email == email).first()
    if not existing_tr:
        db.add(TesterRequest(email=email, name=display_name, organization="SortifyAI User", status="registered"))
        db.commit()

    token = create_access_token({"sub": str(new_user.id), "email": new_user.email, "role": new_user.role or "user"})

    return {
        "status": "success",
        "message": "Account created successfully!",
        "token": token,
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "name": new_user.name,
            "role": new_user.role or "user",
            "avatar_url": new_user.avatar_url
        }
    }

@app.post("/auth/login", summary="Sign In with Username or Email + Password")
async def login_user(req: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticates a user via Username/Email and password."""
    identifier = req.identifier.strip().lower()
    if not identifier:
        raise HTTPException(status_code=400, detail="Please enter your username or email.")
    if not req.password:
        raise HTTPException(status_code=400, detail="Please enter your password.")

    user = db.query(User).filter(
        (User.username == identifier) | (User.email == identifier)
    ).first()

    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid username/email or password.")

    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username/email or password.")

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role or "user"})

    return {
        "status": "success",
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "name": user.name,
            "role": user.role or "user",
            "avatar_url": user.avatar_url
        }
    }

# ==========================================
# Admin Portal & AI Configuration Management
# ==========================================

def verify_admin_access(
    admin_key: Optional[str] = None,
    user: Optional[User] = None
) -> bool:
    if admin_key and admin_key.strip() == ADMIN_KEY:
        return True
    if user and user.role == "admin":
        return True
    return False

@app.post("/admin/verify", summary="Verify Admin Key")
async def verify_admin(payload: Dict[str, str]):
    key = payload.get("admin_key", "")
    if key.strip() == ADMIN_KEY:
        return {"status": "success", "valid": True}
    raise HTTPException(status_code=403, detail="Invalid Admin Passcode.")

@app.get("/admin/ai-configs", summary="Get all configured AI providers")
async def get_ai_configs(admin_key: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns AI model configurations for Gemini, OpenAI, GitHub Models, and OpenRouter."""
    if not verify_admin_access(admin_key=admin_key):
        raise HTTPException(status_code=403, detail="Unauthorized admin access.")

    configs = db.query(AIConfig).all()
    results = []
    for cfg in configs:
        masked_key = ""
        if cfg.api_key:
            clean = cfg.api_key.strip()
            if len(clean) > 8:
                masked_key = f"{clean[:4]}••••••••{clean[-4:]}"
            else:
                masked_key = "••••••••"
        results.append({
            "id": cfg.id,
            "provider": cfg.provider,
            "display_name": cfg.display_name,
            "has_key": bool(cfg.api_key),
            "masked_key": masked_key,
            "key_name": getattr(cfg, 'key_name', 'Default Key'),
            "model": cfg.model,
            "base_url": cfg.base_url,
            "is_active": cfg.is_active,
            "is_working": getattr(cfg, 'is_working', True),
            "updated_at": cfg.updated_at.isoformat() if cfg.updated_at else None
        })
    return {"configs": results}

@app.post("/admin/ai-configs", summary="Save or activate AI Provider Configuration")
async def save_ai_config(
    req: SaveAIConfigRequest,
    admin_key: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Saves API credentials and model for a provider, and immediately updates running AI engine."""
    if not verify_admin_access(admin_key=admin_key):
        raise HTTPException(status_code=403, detail="Unauthorized admin access.")

    if req.id:
        cfg = db.query(AIConfig).filter(AIConfig.id == req.id).first()
    else:
        cfg = None

    if not cfg:
        cfg = AIConfig(
            provider=req.provider,
            key_name=req.key_name or "Default Key",
            display_name=req.provider.capitalize(),
            api_key=req.api_key.strip() if req.api_key else None,
            model=req.model,
            base_url=req.base_url,
            is_active=req.is_active or False
        )
        db.add(cfg)
    else:
        if req.api_key and not req.api_key.startswith("••"):
            cfg.api_key = req.api_key.strip()
        if req.key_name:
            cfg.key_name = req.key_name.strip()
        if req.model:
            cfg.model = req.model.strip()
        if req.base_url:
            cfg.base_url = req.base_url.strip()
        if req.is_active is not None:
            cfg.is_active = req.is_active
        cfg.updated_at = datetime.utcnow()

    # If this config was activated, deactivate all other providers
    if req.is_active:
        db.query(AIConfig).filter(AIConfig.provider != req.provider).update({"is_active": False})

    db.commit()

    # Reload active AI engine in-memory configuration
    ai_agent._load_keys()
    ai_agent._initialize_client()

    return {
        "status": "success",
        "message": f"Updated AI provider '{req.provider}' successfully.",
        "active_provider": ai_agent.provider,
        "active_model": ai_agent.model
    }

@app.delete("/admin/ai-configs/{config_id}", summary="Delete an AI Provider Configuration")
async def delete_ai_config(config_id: int, admin_key: Optional[str] = None, db: Session = Depends(get_db)):
    if not verify_admin_access(admin_key=admin_key):
        raise HTTPException(status_code=403, detail="Unauthorized admin access.")
    cfg = db.query(AIConfig).filter(AIConfig.id == config_id).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="Config not found.")
    db.delete(cfg)
    db.commit()
    
    ai_agent._load_keys()
    ai_agent._initialize_client()
    return {"status": "success", "message": "Deleted config successfully."}

@app.post("/admin/ai-configs/test", summary="Test AI Provider Connection")
async def test_ai_provider(
    req: TestAIConfigRequest,
    admin_key: Optional[str] = None
):
    """Tests connectivity to an AI endpoint (Gemini, OpenAI, GitHub Models, or OpenRouter)."""
    if not verify_admin_access(admin_key=admin_key):
        raise HTTPException(status_code=403, detail="Unauthorized admin access.")

    result = AIGroupingAgent.test_connection(
        provider=req.provider,
        api_key=req.api_key.strip(),
        model=req.model.strip(),
        base_url=req.base_url.strip() if req.base_url else None
    )
    return result

@app.get("/admin/users", summary="List All Registered Users and Emails for Future Migration")
async def list_admin_users(
    admin_key: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Returns directory of all registered users and their emails to assist future Google migration."""
    if not verify_admin_access(admin_key=admin_key):
        raise HTTPException(status_code=403, detail="Unauthorized admin access.")

    users = db.query(User).order_by(User.created_at.desc()).all()
    emails = [u.email for u in users if u.email]
    
    # Also fetch tester_requests for complete picture
    tester_reqs = db.query(TesterRequest).all()
    all_unique_emails = list(dict.fromkeys(emails + [t.email for t in tester_reqs if t.email]))

    return {
        "total_users": len(users),
        "total_emails_collected": len(all_unique_emails),
        "comma_separated_emails": ", ".join(all_unique_emails),
        "users": [
            {
                "id": u.id,
                "username": u.username or "—",
                "email": u.email,
                "name": u.name,
                "role": u.role or "user",
                "has_password": bool(u.password_hash),
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "saved_projects_count": len(u.projects) if u.projects else 0
            }
            for u in users
        ],
        "tester_waitlist": [
            {
                "email": t.email,
                "name": t.name,
                "status": t.status,
                "created_at": t.created_at.isoformat() if t.created_at else None
            }
            for t in tester_reqs
        ]
    }

@app.post("/projects/save", summary="Save a Grouping Project to Cloud")
async def save_project(
    req: SaveProjectRequest,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Saves a generated grouping session into user's Neon cloud account."""
    if not user:
        raise HTTPException(status_code=401, detail="Please sign in with Google to save projects.")

    new_project = Project(
        user_id=user.id,
        title=req.title,
        filename=req.filename,
        total_students=req.total_students or 0,
        groups_count=req.groups_count or len(req.groups_data),
        groups_json=json.dumps(req.groups_data)
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return {
        "status": "success",
        "message": "Project saved successfully to your cloud account.",
        "project": {
            "id": new_project.id,
            "title": new_project.title,
            "filename": new_project.filename,
            "total_students": new_project.total_students,
            "groups_count": new_project.groups_count,
            "created_at": new_project.created_at.isoformat()
        }
    }

@app.get("/projects", summary="List All Saved Projects for User")
async def list_user_projects(
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all saved projects for the currently logged in user."""
    if not user:
        raise HTTPException(status_code=401, detail="Please sign in with Google to view saved projects.")

    projects = db.query(Project).filter(Project.user_id == user.id).order_by(Project.created_at.desc()).all()
    return {
        "projects": [
            {
                "id": p.id,
                "title": p.title,
                "filename": p.filename,
                "total_students": p.total_students,
                "groups_count": p.groups_count,
                "created_at": p.created_at.isoformat()
            }
            for p in projects
        ]
    }

@app.get("/projects/{project_id}", summary="Load a Specific Saved Project")
async def get_project_details(
    project_id: int,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves full groups and analytics data for a saved project."""
    if not user:
        raise HTTPException(status_code=401, detail="Please sign in with Google.")

    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    return {
        "id": project.id,
        "title": project.title,
        "filename": project.filename,
        "total_students": project.total_students,
        "groups_count": project.groups_count,
        "groups": json.loads(project.groups_json),
        "created_at": project.created_at.isoformat()
    }

@app.delete("/projects/{project_id}", summary="Delete a Saved Project")
async def delete_project(
    project_id: int,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a saved project."""
    if not user:
        raise HTTPException(status_code=401, detail="Please sign in with Google.")

    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    db.delete(project)
    db.commit()
    return {"status": "success", "message": "Project deleted successfully."}


