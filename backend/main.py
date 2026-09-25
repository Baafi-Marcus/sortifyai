from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import shutil
import os
import uuid
import pandas as pd
import json
import re
from typing import List
from datetime import datetime

from data_engine import DataExtractor
from ai_engine import AIGroupingAgent
from database import init_db, get_db, SessionLocal, File as DBFile, ChatHistory, Grouping, Feedback
from whatsapp_service import send_feedback_notification

app = FastAPI(title="SortifyAI Backend")

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

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

# Request Models
class GroupingRequest(BaseModel):
    file_id: str
    instructions: str

class InterpretRequest(BaseModel):
    file_id: str
    instructions: str

class CheckGroupsRequest(BaseModel):
    file_id: str
    group_column: str = None

class FeedbackRequest(BaseModel):
    name: str = None
    email: str = None
    rating: int
    message: str

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

    chats = db.query(ChatHistory).filter(ChatHistory.file_id == file_id).order_by(ChatHistory.timestamp).all()
    return {
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

@app.delete("/files/{file_id}")
async def delete_file(file_id: str, db: Session = Depends(get_db)):
    """Delete a file and all its associated data"""
    db_file = db.query(DBFile).filter(DBFile.file_id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Delete physical file
    if os.path.exists(db_file.file_path):
        os.remove(db_file.file_path)
    
    
    # Delete from database (cascades to chat_history and groupings)
    db.delete(db_file)
    db.commit()
    
    return {"message": "File deleted successfully"}

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
