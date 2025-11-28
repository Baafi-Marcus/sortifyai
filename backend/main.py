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
    allow_origins=["http://localhost:3000", "https://sortify-ai.vercel.app"],
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

class FeedbackRequest(BaseModel):
    name: str = None
    email: str = None
    rating: int
    message: str

@app.get("/")
def read_root():
    return {"message": "SortifyAI Backend is running"}

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
        
        # Create initial DB record
        db_file = DBFile(
            file_id=file_id,
            filename=file.filename,
            file_path=file_path,
            total_rows=0, 
            data_summary="Processing...",
            processed=False
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        
        # Schedule background processing
        if background_tasks:
            background_tasks.add_task(process_file_background, file_id, file_path)
        
        return {
            "file_id": file_id,
            "filename": file.filename,
            "summary": "Processing...",
            "total_rows": 0,
            "status": "processing"
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
        
        return {
            "groups": groups_with_data,
            "explanation": rules.get("explanation", ""),
            "total_rows": total_rows,
            "grouped_rows": grouped_count,
            "all_included": grouped_count == total_rows
        }
    except Exception as e:
        print(f"Grouping error: {e}")
        raise HTTPException(status_code=500, detail=f"Grouping failed: {str(e)}")

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
