from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schemas import (
    Topic, QuizAttempt, StudyNotesResponse, QuizQuestion, TutorChatRequest
)
from app.services.ai_gateway import ai_gateway
from app.engines.adaptive_replan import AdaptiveReplanningEngine

router = APIRouter(prefix="/study", tags=["Study Workspace & AI Tutor"])

@router.get("/topic/{topic_id}/notes", response_model=StudyNotesResponse)
def get_topic_notes(topic_id: str, db: Session = Depends(get_db)):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    subj_name = ""
    if topic.unit and topic.unit.subject:
        subj_name = topic.unit.subject.name

    notes = ai_gateway.generate_study_notes(topic.name, subj_name)
    return StudyNotesResponse(
        topic_id=topic.id,
        topic_name=topic.name,
        key_points=notes.get("key_points", []),
        core_formulas=notes.get("core_formulas", []),
        definitions=notes.get("definitions", []),
        concept_diagram_mermaid=notes.get("concept_diagram_mermaid", ""),
        recommended_reading=notes.get("recommended_reading", [])
    )

@router.get("/topic/{topic_id}/quiz", response_model=List[QuizQuestion])
def get_topic_quiz(topic_id: str, count: int = 5, db: Session = Depends(get_db)):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    quiz_data = ai_gateway.generate_quiz(topic.name, count=count)
    return quiz_data

@router.post("/topic/{topic_id}/quiz/submit")
def submit_topic_quiz(
    topic_id: str,
    payload: Dict[str, Any], # { user_id: str, total_questions: int, correct_answers: int }
    db: Session = Depends(get_db)
):
    user_id = payload.get("user_id")
    total_q = int(payload.get("total_questions", 5))
    correct_q = int(payload.get("correct_answers", 0))

    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    result = AdaptiveReplanningEngine.handle_quiz_submission(
        db=db,
        topic_id=topic_id,
        user_id=user_id,
        total_questions=total_q,
        correct_answers=correct_q
    )

    return result

@router.post("/tutor/chat")
def tutor_chat(payload: TutorChatRequest, db: Session = Depends(get_db)):
    topic = db.query(Topic).filter(Topic.id == payload.topic_id).first()
    topic_name = topic.name if topic else "Exam Topic"

    reply = ai_gateway.tutor_chat(
        topic_name=topic_name,
        user_query=payload.message,
        history=payload.conversation_history
    )
    return {
        "topic_id": payload.topic_id,
        "reply": reply
    }
