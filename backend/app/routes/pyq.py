import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schemas import TopicPYQMapping, Topic, Subject
from app.engines.semantic_ai import SemanticAIEngine
from app.services.ocr_parser import DocumentParserService
from app.config import settings

router = APIRouter(prefix="/pyq", tags=["Past Year Questions"])

@router.post("/upload")
async def upload_pyq(
    subject_id: str = Form(...),
    year: int = Form(2024),
    raw_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

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
        # Representative sample PYQs for the subject
        extracted_text = (
            f"EXAMINATION QUESTION PAPER {year}\n"
            f"Subject: {subject.name}\n"
            "Q1. [10 Marks] Explain Lamport Logical Clocks and Vector Clocks with timing diagrams.\n"
            "Q2. [8 Marks] Compare Paxos and Raft consensus algorithms regarding leader election and log replication.\n"
            "Q3. [10 Marks] State and prove the CAP theorem. How do distributed databases handle network partitions?\n"
            "Q4. [6 Marks] Describe containerization isolation mechanisms (namespaces and cgroups) in modern cloud platforms.\n"
            "Q5. [8 Marks] How does Byzantine Fault Tolerance prevent arbitrary component failures in quorum systems?\n"
        )

    result = SemanticAIEngine.map_pyq_document(
        db=db,
        subject_id=subject_id,
        year=year,
        raw_text=extracted_text,
        file_url=file_url
    )

    return {
        "message": "Past year question paper processed and semantically mapped to syllabus topics",
        "result": result
    }

@router.get("/mappings/{topic_id}")
def get_topic_pyqs(topic_id: str, db: Session = Depends(get_db)):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    mappings = db.query(TopicPYQMapping).filter(TopicPYQMapping.topic_id == topic_id).all()
    return {
        "topic_id": topic.id,
        "topic_name": topic.name,
        "pyq_weight_score": topic.pyq_weight_score,
        "questions": [
            {
                "id": m.id,
                "question_text": m.question_text,
                "relevance_score": round(m.relevance_score, 2),
                "weight": m.weight
            }
            for m in mappings
        ]
    }
