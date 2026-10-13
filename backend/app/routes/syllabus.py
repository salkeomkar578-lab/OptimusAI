import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schemas import (
    Syllabus, Subject, Unit, Topic, TopicResponse, UnitResponse, SubjectResponse, SyllabusResponse
)
from app.engines.semantic_ai import SemanticAIEngine
from app.services.ocr_parser import DocumentParserService
from app.config import settings

router = APIRouter(prefix="/syllabus", tags=["Syllabus"])

@router.post("/upload")
async def upload_syllabus(
    user_id: str = Form(...),
    title: str = Form("Course Syllabus"),
    raw_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
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
            "Subject: Distributed Systems & Cloud Computing\n"
            "Unit 1: Distributed Architectures and Virtualization\n"
            "- Cloud Service Models (IaaS, PaaS, SaaS)\n"
            "- Hypervisors and Containerization (Docker, cgroups)\n"
            "- Microservices Architecture & Service Mesh\n"
            "Unit 2: Consensus, Synchronization and Consistency\n"
            "- Logical Clocks (Lamport Timestamps and Vector Clocks)\n"
            "- Distributed Mutual Exclusion Algorithms\n"
            "- Paxos and Raft Consensus Protocols\n"
            "- CAP Theorem and Eventual Consistency Models\n"
            "Unit 3: Fault Tolerance, Storage and Reliability\n"
            "- Distributed Key-Value Stores (Dynamo, Cassandra)\n"
            "- Byzantine Fault Tolerance & Quorum Systems\n"
            "- Replication, Sharding, and Failure Detectors\n"
        )

    syllabus = SemanticAIEngine.process_and_store_syllabus(
        db=db,
        user_id=user_id,
        title=title,
        raw_text=extracted_text,
        file_url=file_url
    )

    return {
        "message": "Syllabus processed and structured successfully",
        "syllabus_id": syllabus.id,
        "title": syllabus.title,
        "subject_count": len(syllabus.subjects)
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
                    pyq_count=len(t.pyq_mappings)
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
    syllabi = db.query(Syllabus).filter(Syllabus.user_id == user_id).all()
    # Return basic list
    results = []
    for syl in syllabi:
        results.append(get_syllabus_tree(syl.id, db))
    return results
