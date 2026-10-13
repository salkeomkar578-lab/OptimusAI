import logging
from datetime import datetime, date, time, timedelta
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from app.config import settings
from app.models.schemas import (
    Topic, User, AvailabilitySlot, StudySession, generate_uuid
)
from app.engines.priority_engine import PriorityEngine

logger = logging.getLogger("optimus.scheduler")

class DeterministicSchedulerEngine:
    @staticmethod
    def _parse_time(t_str: str) -> time:
        parts = t_str.split(":")
        return time(hour=int(parts[0]), minute=int(parts[1]))

    @staticmethod
    def generate_schedule(
        db: Session, 
        user_id: str, 
        horizon_days: int = 14,
        start_from: Optional[datetime] = None
    ) -> List[StudySession]:
        """
        Deterministic Constraint-Based Scheduler:
        1. Reads active user availability_slots.
        2. Recalculates up-to-date topic priorities deterministically.
        3. Cleans future pending 'scheduled' sessions from start_from.
        4. Packs topics into concrete time blocks enforcing:
           - Hard time constraints (only inside defined availability windows).
           - Highest-priority topics allocated first.
           - Spaced Repetition (intervals: 1d, 3d, 7d, 14d) for completed topics.
        """
        if start_from is None:
            start_from = datetime.utcnow()

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")

        # 1. Update all priorities
        topics = PriorityEngine.recalculate_user_priorities(db, user_id)
        if not topics:
            return []

        # 2. Get user availability slots
        slots = db.query(AvailabilitySlot).filter(AvailabilitySlot.user_id == user_id).all()
        if not slots:
            # If user hasn't defined custom slots yet, create default sensible slots (e.g., 18:00 to 20:00 every day)
            slots = []
            for dow in range(7):
                def_slot = AvailabilitySlot(
                    id=generate_uuid(),
                    user_id=user_id,
                    day_of_week=dow,
                    start_time="18:00",
                    end_time="20:00",
                    is_recurring=True
                )
                db.add(def_slot)
                slots.append(def_slot)
            db.commit()

        # Slot map by day_of_week (0=Mon or 0=Sun; in Python datetime.weekday(): 0=Monday, 6=Sunday)
        # Note: In our model, we support day_of_week 0..6
        slots_by_day = {i: [] for i in range(7)}
        for s in slots:
            slots_by_day[s.day_of_week].append(s)

        # 3. Remove uncompleted future sessions from start_from to avoid overlaps during replan
        db.query(StudySession).filter(
            StudySession.user_id == user_id,
            StudySession.status == "scheduled",
            StudySession.start_time >= start_from
        ).delete(synchronize_session=False)
        db.flush()

        # 4. Partition topics: Spaced Repetition dues vs New / Incomplete study topics
        revision_topics: List[Topic] = []
        study_topics: List[Topic] = []

        now = datetime.utcnow()
        for t in topics:
            if t.next_revision_due and t.next_revision_due <= (now + timedelta(days=horizon_days)):
                revision_topics.append(t)
            else:
                study_topics.append(t)

        # Sort both by priority descending
        revision_topics.sort(key=lambda x: x.calculated_priority, reverse=True)
        study_topics.sort(key=lambda x: x.calculated_priority, reverse=True)

        new_sessions = []
        topic_study_idx = 0
        topic_rev_idx = 0

        # Iterate through days in planning horizon
        curr_date = start_from.date()
        for day_offset in range(horizon_days):
            target_date = curr_date + timedelta(days=day_offset)
            dow = target_date.weekday() # 0 = Monday, 6 = Sunday

            day_slots = slots_by_day.get(dow, [])
            for slot in day_slots:
                st = DeterministicSchedulerEngine._parse_time(slot.start_time)
                et = DeterministicSchedulerEngine._parse_time(slot.end_time)

                slot_start = datetime.combine(target_date, st)
                slot_end = datetime.combine(target_date, et)

                # Skip if already in the past
                if slot_end <= start_from:
                    continue

                # Decide session type: check if high-priority revision is due
                chosen_topic = None
                session_type = "study"

                # Check if revision topic is due on or before this day
                if topic_rev_idx < len(revision_topics):
                    cand_rev = revision_topics[topic_rev_idx]
                    if cand_rev.next_revision_due and cand_rev.next_revision_due.date() <= target_date:
                        chosen_topic = cand_rev
                        session_type = "revision" if (day_offset % 2 == 0) else "quiz"
                        topic_rev_idx += 1

                if not chosen_topic:
                    if topic_study_idx < len(study_topics):
                        chosen_topic = study_topics[topic_study_idx]
                        session_type = "study"
                        topic_study_idx += 1
                    elif topic_rev_idx < len(revision_topics):
                        chosen_topic = revision_topics[topic_rev_idx]
                        session_type = "revision"
                        topic_rev_idx += 1
                    else:
                        # Wrap around highest priority topics for reinforcement
                        if topics:
                            chosen_topic = topics[(day_offset) % len(topics)]
                            session_type = "quiz" if (day_offset % 3 == 0) else "revision"

                if chosen_topic:
                    session = StudySession(
                        id=generate_uuid(),
                        user_id=user_id,
                        topic_id=chosen_topic.id,
                        start_time=slot_start,
                        end_time=slot_end,
                        status="scheduled",
                        session_type=session_type,
                        created_at=datetime.utcnow()
                    )
                    db.add(session)
                    new_sessions.append(session)

        db.commit()
        return new_sessions
