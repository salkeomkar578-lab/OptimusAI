from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schemas import (
    StudySession, StudySessionResponse, SessionUpdateStatusRequest, Topic, Unit, Subject
)
from app.engines.scheduler import DeterministicSchedulerEngine
from app.engines.adaptive_replan import AdaptiveReplanningEngine

router = APIRouter(prefix="/planner", tags=["Planner & Schedule"])

@router.post("/generate/{user_id}", response_model=List[StudySessionResponse])
def generate_user_schedule(
    user_id: str, 
    horizon_days: int = 14, 
    db: Session = Depends(get_db)
):
    """
    Deterministic schedule generator enforcing availability slots,
    priority rankings, and spaced repetition intervals.
    """
    try:
        sessions = DeterministicSchedulerEngine.generate_schedule(
            db=db,
            user_id=user_id,
            horizon_days=horizon_days
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Enrich with topic and subject titles
    results = []
    for s in sessions:
        topic = db.query(Topic).filter(Topic.id == s.topic_id).first()
        topic_name = topic.name if topic else "Unknown Topic"
        subject_name = ""
        priority = topic.calculated_priority if topic else 0.0
        if topic and topic.unit and topic.unit.subject:
            subject_name = topic.unit.subject.name

        results.append(StudySessionResponse(
            id=s.id,
            user_id=s.user_id,
            topic_id=s.topic_id,
            topic_name=topic_name,
            subject_name=subject_name,
            start_time=s.start_time,
            end_time=s.end_time,
            status=s.status,
            session_type=s.session_type,
            calculated_priority=priority
        ))
    return results

@router.get("/sessions/{user_id}", response_model=List[StudySessionResponse])
def get_user_sessions(user_id: str, db: Session = Depends(get_db)):
    sessions = (
        db.query(StudySession)
        .filter(StudySession.user_id == user_id)
        .order_by(StudySession.start_time.asc())
        .all()
    )

    results = []
    for s in sessions:
        topic = db.query(Topic).filter(Topic.id == s.topic_id).first()
        topic_name = topic.name if topic else "Unknown Topic"
        subject_name = ""
        priority = topic.calculated_priority if topic else 0.0
        if topic and topic.unit and topic.unit.subject:
            subject_name = topic.unit.subject.name

        results.append(StudySessionResponse(
            id=s.id,
            user_id=s.user_id,
            topic_id=s.topic_id,
            topic_name=topic_name,
            subject_name=subject_name,
            start_time=s.start_time,
            end_time=s.end_time,
            status=s.status,
            session_type=s.session_type,
            calculated_priority=priority
        ))
    return results

@router.post("/sessions/{session_id}/status")
def update_session_status(
    session_id: str,
    payload: SessionUpdateStatusRequest,
    db: Session = Depends(get_db)
):
    """
    Updates session status (completed / skipped / rescheduled).
    Crucial: triggers the Adaptive Replanning loop on 'skipped' or 'completed'!
    """
    try:
        replan_result = AdaptiveReplanningEngine.handle_session_status_change(
            db=db,
            session_id=session_id,
            new_status=payload.status
        )
        return {
            "message": f"Session status updated to '{payload.status}'",
            "result": replan_result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
