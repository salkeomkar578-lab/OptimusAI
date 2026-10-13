from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models.schemas import Topic, User, Subject, Unit, Syllabus

class PriorityEngine:
    @staticmethod
    def calculate_topic_priority(
        topic: Topic, 
        target_exam_date: Optional[datetime] = None,
        now: Optional[datetime] = None
    ) -> float:
        """
        Calculates priority score for a topic using the deterministic formula:
        Priority = (w1 * PYQ Weight) + (w2 * (10 - Mastery Score)) + (w3 * Exam Urgency) + (w4 * Revision Overdue Penalty)
        """
        if now is None:
            now = datetime.utcnow()

        # 1. PYQ Weight (0.0 to 10.0)
        pyq_weight = float(topic.pyq_weight_score or 0.0)
        pyq_weight = min(max(pyq_weight, 0.0), 10.0)

        # 2. Mastery Score Weakness (0.0 to 10.0)
        mastery = float(topic.user_mastery_score or 0.0)
        mastery = min(max(mastery, 0.0), 10.0)
        weakness_score = 10.0 - mastery

        # 3. Exam Urgency (0.0 to 10.0)
        if target_exam_date:
            days_until_exam = (target_exam_date - now).total_seconds() / 86400.0
            if days_until_exam <= 0:
                exam_urgency = 10.0
            else:
                # Exponential decay towards 0 as days increase; high urgency within 30 days
                exam_urgency = 10.0 / (1.0 + (days_until_exam / 14.0))
        else:
            exam_urgency = 5.0 # Balanced default
        exam_urgency = min(max(exam_urgency, 0.0), 10.0)

        # 4. Revision Overdue Penalty (0.0 to 10.0)
        revision_penalty = 0.0
        if topic.next_revision_due and now > topic.next_revision_due:
            overdue_days = (now - topic.next_revision_due).total_seconds() / 86400.0
            # Escalates by 2.0 points per overdue day up to 10.0
            revision_penalty = min(10.0, max(0.0, overdue_days * 2.0))

        # Weighted calculation
        priority = (
            (settings.WEIGHT_PYQ * pyq_weight) +
            (settings.WEIGHT_WEAKNESS * weakness_score) +
            (settings.WEIGHT_URGENCY * exam_urgency) +
            (settings.WEIGHT_OVERDUE * revision_penalty)
        )

        return round(float(priority), 2)

    @staticmethod
    def recalculate_user_priorities(db: Session, user_id: str) -> List[Topic]:
        """
        Recalculates and updates the priority score for all topics belonging to a user.
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return []

        topics = (
            db.query(Topic)
            .join(Unit, Topic.unit_id == Unit.id)
            .join(Subject, Unit.subject_id == Subject.id)
            .join(Syllabus, Subject.syllabus_id == Syllabus.id)
            .filter(Syllabus.user_id == user_id)
            .all()
        )

        now = datetime.utcnow()
        for t in topics:
            p = PriorityEngine.calculate_topic_priority(t, user.target_exam_date, now=now)
            t.calculated_priority = p

        db.commit()
        return topics
