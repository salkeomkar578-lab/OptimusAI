import os
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schemas import (
    Syllabus, Subject, Unit, Topic, User, TopicResponse, UnitResponse, SubjectResponse, SyllabusResponse
)
from app.engines.semantic_ai import SemanticAIEngine
from app.engines.priority_engine import PriorityEngine
from app.services.ai_gateway import ai_gateway
from app.services.ocr_parser import DocumentParserService
from app.config import settings

router = APIRouter(prefix="/syllabus", tags=["Syllabus"])

class SyllabusPreviewRequest(BaseModel):
    raw_text: str
    title: Optional[str] = "Course Syllabus"

@router.post("/preview")
def preview_syllabus_parse(payload: SyllabusPreviewRequest):
    """
    Simulates parsing without persisting to database.
    Allows user to test and view structured JSON in real time.
    """
    parsed = ai_gateway.parse_syllabus(payload.raw_text, default_title=payload.title or "Course Syllabus")
    return {
        "status": "success",
        "parsed": parsed
    }

@router.post("/upload")
async def upload_syllabus(
    user_id: str = Form(...),
    title: str = Form("Course Syllabus"),
    raw_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    api_key: Optional[str] = Form(None),
    ai_provider: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    # If user provided runtime API key, configure it immediately
    if api_key and ai_provider:
        settings.set_ai_key(ai_provider, api_key)
        ai_gateway.refresh_keys()

    extracted_text = ""
    file_url = None

    if file and file.filename:
        content = await file.read()
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            f.write(content)
        file_url = f"/uploads/{file.filename}"

        if file.filename.lower().endswith(".pdf"):
            extracted_text = DocumentParserService.extract_text_from_pdf(file_path)
        else:
            extracted_text = DocumentParserService.extract_text_from_bytes(content, file.filename)

    if not extracted_text and raw_text:
        extracted_text = raw_text

    if not extracted_text.strip():
        # Provide sample default syllabus text if empty
        extracted_text = (
            f"Subject: {title}\n"
            "Unit 1: Foundations and Fundamental Principles\n"
            "- Introduction to Core Taxonomy and Theoretical Bounds\n"
            "- State Architectures and Invariant Conservation\n"
            "- Operational Workflows and Analysis\n"
            "Unit 2: Applied Techniques and Methodology\n"
            "- Practical Implementation and Execution Models\n"
            "- Quantitative Optimization and Stress Testing\n"
            "- Comparative Performance Analysis\n"
            "Unit 3: Advanced Topics and Synthesis\n"
            "- Complex Problem Solving and Scalability Constraints\n"
            "- System Verification and Resiliency Formulations\n"
            "- Future Trends and Synthesis\n"
        )

    # Ensure user exists in database to satisfy foreign keys
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(
            id=user_id,
            email=f"{user_id}@optimus.ai",
            name="Student",
            target_exam_date=datetime.utcnow() + timedelta(days=21),
            created_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()

    syllabus = SemanticAIEngine.process_and_store_syllabus(
        db=db,
        user_id=user_id,
        title=title,
        raw_text=extracted_text,
        file_url=file_url
    )

    # Calibrate priorities for new syllabus topics
    try:
        PriorityEngine.recalculate_user_priorities(db, user_id)
    except Exception:
        pass

    full_tree = get_syllabus_tree(syllabus.id, db)

    return {
        "message": "Syllabus processed and structured successfully",
        "syllabus_id": syllabus.id,
        "title": syllabus.title,
        "subject_count": len(syllabus.subjects),
        "tree": full_tree
    }

@router.get("/{syllabus_id}", response_model=SyllabusResponse)
def get_syllabus_tree(syllabus_id: str, db: Session = Depends(get_db)):
    syllabus = db.query(Syllabus).filter(Syllabus.id == syllabus_id).first()
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")
    
    # Construct structured tree with PYQ counts
    subjects_res = []
    for s in syllabus.subjects:
        units_res = []
        for u in s.units:
            topics_res = []
            for t in u.topics:
                topics_res.append(TopicResponse(
                    id=t.id,
                    unit_id=t.unit_id,
                    name=t.name,
                    description=t.description,
                    estimated_hours=t.estimated_hours,
                    pyq_weight_score=t.pyq_weight_score,
                    user_mastery_score=t.user_mastery_score,
                    calculated_priority=t.calculated_priority,
                    last_studied_at=t.last_studied_at,
                    next_revision_due=t.next_revision_due,
                    pyq_count=len(t.pyq_mappings) if t.pyq_mappings else 0
                ))
            units_res.append(UnitResponse(
                id=u.id,
                subject_id=u.subject_id,
                name=u.name,
                order_index=u.order_index,
                topics=topics_res
            ))
        subjects_res.append(SubjectResponse(
            id=s.id,
            syllabus_id=s.syllabus_id,
            name=s.name,
            order_index=s.order_index,
            units=units_res
        ))

    return SyllabusResponse(
        id=syllabus.id,
        user_id=syllabus.user_id,
        title=syllabus.title,
        raw_file_url=syllabus.raw_file_url,
        created_at=syllabus.created_at,
        subjects=subjects_res
    )

@router.get("/user/{user_id}", response_model=List[SyllabusResponse])
def get_user_syllabi(user_id: str, db: Session = Depends(get_db)):
    # Order by newest first
    syllabi = (
        db.query(Syllabus)
        .filter(Syllabus.user_id == user_id)
        .order_by(Syllabus.created_at.desc())
        .all()
    )
    
    # Fallback to any recent syllabus if user_id has none
    if not syllabi:
        syllabi = db.query(Syllabus).order_by(Syllabus.created_at.desc()).all()

    results = []
    for syl in syllabi:
        results.append(get_syllabus_tree(syl.id, db))
    return results
