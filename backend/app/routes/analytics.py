from datetime import datetime, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schemas import Topic, Unit, Subject, Syllabus, StudySession, QuizAttempt

router = APIRouter(prefix="/analytics", tags=["Analytics & Performance"])

@router.get("/{user_id}")
def get_user_analytics(user_id: str, db: Session = Depends(get_db)):
    topics = (
        db.query(Topic)
        .join(Unit, Topic.unit_id == Unit.id)
        .join(Subject, Unit.subject_id == Subject.id)
        .join(Syllabus, Subject.syllabus_id == Syllabus.id)
        .filter(Syllabus.user_id == user_id)
        .all()
    )

    total_topics = len(topics)
    if total_topics == 0:
        return {
            "total_topics": 0,
            "coverage_percentage": 0.0,
            "average_mastery": 0.0,
            "mastery_distribution": {"mastered": 0, "in_progress": 0, "needs_attention": 0},
            "weak_areas": [],
            "high_yield_topics": [],
            "session_stats": {"completed": 0, "scheduled": 0, "skipped": 0},
            "quiz_attempts": []
        }

    # Coverage: topics studied or with mastery > 0
    studied_topics = sum(1 for t in topics if t.last_studied_at is not None or (t.user_mastery_score or 0.0) >= 3.0)
    coverage_pct = round((studied_topics / total_topics) * 100.0, 1)

    avg_mastery = round(sum(float(t.user_mastery_score or 0.0) for t in topics) / total_topics, 2)

    mastered = sum(1 for t in topics if (t.user_mastery_score or 0.0) >= 7.0)
    in_progress = sum(1 for t in topics if 3.0 <= (t.user_mastery_score or 0.0) < 7.0)
    needs_attention = sum(1 for t in topics if (t.user_mastery_score or 0.0) < 3.0)

    # Weak areas: topics with high priority and low mastery
    sorted_weak = sorted(topics, key=lambda t: (t.calculated_priority, -(t.user_mastery_score or 0.0)), reverse=True)
    weak_areas = [
        {
            "id": t.id,
            "name": t.name,
            "subject": t.unit.subject.name if (t.unit and t.unit.subject) else "",
            "mastery_score": t.user_mastery_score,
            "priority": t.calculated_priority,
            "pyq_weight": t.pyq_weight_score
        }
        for t in sorted_weak[:5]
    ]

    # High yield: highest PYQ weights
    sorted_pyq = sorted(topics, key=lambda t: t.pyq_weight_score or 0.0, reverse=True)
    high_yield = [
        {
            "id": t.id,
            "name": t.name,
            "subject": t.unit.subject.name if (t.unit and t.unit.subject) else "",
            "pyq_weight": t.pyq_weight_score,
            "mastery_score": t.user_mastery_score
        }
        for t in sorted_pyq[:5]
    ]

    # Sessions stats
    sessions = db.query(StudySession).filter(StudySession.user_id == user_id).all()
    session_stats = {
        "completed": sum(1 for s in sessions if s.status == "completed"),
        "scheduled": sum(1 for s in sessions if s.status == "scheduled"),
        "skipped": sum(1 for s in sessions if s.status == "skipped"),
        "rescheduled": sum(1 for s in sessions if s.status == "rescheduled"),
    }

    # Quiz history
    quizzes = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == user_id)
        .order_by(QuizAttempt.completed_at.desc())
        .limit(10)
        .all()
    )
    quiz_history = []
    for q in quizzes:
        t_obj = db.query(Topic).filter(Topic.id == q.topic_id).first()
        quiz_history.append({
            "id": q.id,
            "topic_name": t_obj.name if t_obj else "Topic",
            "score_percentage": q.score_percentage,
            "correct_answers": q.correct_answers,
            "total_questions": q.total_questions,
            "completed_at": q.completed_at.isoformat()
        })

    # Upcoming revision schedule counts (next 7 days)
    now = datetime.utcnow()
    revision_heatmap = []
    for i in range(7):
        day = now + timedelta(days=i)
        count = sum(
            1 for t in topics 
            if t.next_revision_due and t.next_revision_due.date() == day.date()
        )
        revision_heatmap.append({
            "date": day.strftime("%a %d %b"),
            "due_count": count
        })

    return {
        "total_topics": total_topics,
        "coverage_percentage": coverage_pct,
        "average_mastery": avg_mastery,
        "mastery_distribution": {
            "mastered": mastered,
            "in_progress": in_progress,
            "needs_attention": needs_attention
        },
        "weak_areas": weak_areas,
        "high_yield_topics": high_yield,
        "session_stats": session_stats,
        "revision_heatmap": revision_heatmap,
        "quiz_attempts": quiz_history
    }
