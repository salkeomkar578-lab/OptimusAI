import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models.schemas import Topic, StudySession, QuizAttempt, generate_uuid
from app.engines.priority_engine import PriorityEngine
from app.engines.scheduler import DeterministicSchedulerEngine

logger = logging.getLogger("optimus.adaptive_replan")

class AdaptiveReplanningEngine:
    @staticmethod
    def handle_session_status_change(
        db: Session,
        session_id: str,
        new_status: str
    ) -> Dict[str, Any]:
        """
        Processes session status change:
        - 'completed': Increases mastery, sets last_studied_at and next_revision_due (Spaced Repetition).
        - 'skipped': Reduces mastery, boosts priority, triggers dynamic replan to reschedule into earliest upcoming slot.
        - 'rescheduled': Moves session or triggers replan.
        """
        session = db.query(StudySession).filter(StudySession.id == session_id).first()
        if not session:
            raise ValueError(f"Session {session_id} not found")

        old_status = session.status
        session.status = new_status
        topic = db.query(Topic).filter(Topic.id == session.topic_id).first()

        replan_triggered = False

        if new_status == "completed" and topic:
            now = datetime.utcnow()
            topic.last_studied_at = now
            # Increment mastery (+1.5, max 10.0)
            topic.user_mastery_score = min(10.0, float(topic.user_mastery_score or 0.0) + 1.5)
            
            # Determine next spaced repetition interval
            # Intervals: 1 day, 3 days, 7 days, 14 days
            completed_count = db.query(StudySession).filter(
                StudySession.topic_id == topic.id,
                StudySession.status == "completed"
            ).count()

            rep_intervals = settings.SPACED_REPETITION_DAYS
            rep_idx = min(completed_count, len(rep_intervals) - 1)
            interval_days = rep_intervals[rep_idx]
            topic.next_revision_due = now + timedelta(days=interval_days)

            db.commit()
            PriorityEngine.recalculate_user_priorities(db, session.user_id)

        elif new_status == "skipped" and topic:
            # 1. Trigger dynamic replan event
            replan_triggered = True
            
            # 2. Reduce user_mastery_score for the topic (penalize by 1.5 to 2.5, min 0.0)
            current_mastery = float(topic.user_mastery_score or 0.0)
            topic.user_mastery_score = max(0.0, current_mastery - 2.0)
            
            # 3. Mark topic as high-priority for upcoming slot
            topic.next_revision_due = datetime.utcnow() # Immediate revision overdue!
            db.commit()

            # Recalculate priorities so this topic shoots to the top
            PriorityEngine.recalculate_user_priorities(db, session.user_id)

            # 4. Deterministic replanner reslots this topic in earliest availability window
            DeterministicSchedulerEngine.generate_schedule(
                db=db,
                user_id=session.user_id,
                horizon_days=14,
                start_from=session.end_time
            )

        elif new_status == "rescheduled":
            replan_triggered = True
            DeterministicSchedulerEngine.generate_schedule(
                db=db,
                user_id=session.user_id,
                horizon_days=14,
                start_from=session.start_time
            )

        db.commit()
        return {
            "session_id": session_id,
            "old_status": old_status,
            "new_status": new_status,
            "topic_id": topic.id if topic else None,
            "new_mastery_score": topic.user_mastery_score if topic else None,
            "new_priority": topic.calculated_priority if topic else None,
            "replan_triggered": replan_triggered
        }

    @staticmethod
    def handle_quiz_submission(
        db: Session,
        topic_id: str,
        user_id: str,
        total_questions: int,
        correct_answers: int
    ) -> Dict[str, Any]:
        """
        Processes quiz results:
        - If score >= 70%: Boosts topic mastery score and schedules spaced revision.
        - If score < 70%: Weakness detected! Reduces mastery score, triggers replan event,
          and marks topic for urgent upcoming study reinforcement.
        """
        score_pct = round((correct_answers / max(total_questions, 1)) * 100.0, 1)

        attempt = QuizAttempt(
            id=generate_uuid(),
            topic_id=topic_id,
            user_id=user_id,
            total_questions=total_questions,
            correct_answers=correct_answers,
            score_percentage=score_pct,
            completed_at=datetime.utcnow()
        )
        db.add(attempt)
        db.flush()

        topic = db.query(Topic).filter(Topic.id == topic_id).first()
        replan_triggered = False

        if topic:
            if score_pct < 70.0:
                # Weakness detected: Reduce mastery score
                replan_triggered = True
                curr_mastery = float(topic.user_mastery_score or 0.0)
                # Drop mastery proportional to shortfall below 70%
                penalty = round(max(1.0, (70.0 - score_pct) / 15.0), 2)
                topic.user_mastery_score = max(0.0, curr_mastery - penalty)
                topic.next_revision_due = datetime.utcnow() # Due immediately
                db.commit()

                # Recalculate priorities and trigger replan
                PriorityEngine.recalculate_user_priorities(db, user_id)
                DeterministicSchedulerEngine.generate_schedule(
                    db=db,
                    user_id=user_id,
                    horizon_days=14
                )
            else:
                # Mastery demonstrated: Boost mastery score
                curr_mastery = float(topic.user_mastery_score or 0.0)
                boost = round(min(3.0, (score_pct / 100.0) * 2.5), 2)
                topic.user_mastery_score = min(10.0, curr_mastery + boost)
                
                # Set spaced repetition
                topic.last_studied_at = datetime.utcnow()
                topic.next_revision_due = datetime.utcnow() + timedelta(days=3)
                db.commit()
                PriorityEngine.recalculate_user_priorities(db, user_id)

        db.commit()
        return {
            "attempt_id": attempt.id,
            "topic_id": topic_id,
            "score_percentage": score_pct,
            "passed": (score_pct >= 70.0),
            "updated_mastery": topic.user_mastery_score if topic else 0.0,
            "updated_priority": topic.calculated_priority if topic else 0.0,
            "replan_triggered": replan_triggered
        }
