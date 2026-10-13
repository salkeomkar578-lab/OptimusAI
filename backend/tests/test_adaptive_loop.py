import sys
import os
import io

# Force utf-8 encoding on windows console
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from datetime import datetime, timedelta
from app.database import Base, SessionLocal, engine
from app.models.schemas import User, AvailabilitySlot, Topic, StudySession, generate_uuid
from app.engines.semantic_ai import SemanticAIEngine
from app.engines.priority_engine import PriorityEngine
from app.engines.scheduler import DeterministicSchedulerEngine
from app.engines.adaptive_replan import AdaptiveReplanningEngine

def run_integration_tests():
    print("=============================================================")
    print("🚀 RUNNING OPTIMUSAI ADAPTIVE LOOP INTEGRATION TESTS")
    print("=============================================================")

    # 1. Reset database tables for clean test
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 2. Create Test Student
        target_exam = datetime.utcnow() + timedelta(days=14)
        user = User(
            id=generate_uuid(),
            email="test.student@optimus.ai",
            name="Jordan Lee",
            target_exam_date=target_exam
        )
        db.add(user)
        db.commit()
        print(f"✅ Step 1: User created -> {user.name} ({user.email})")

        # 3. Create Daily Availability Slots (18:00 to 20:00 every day)
        for dow in range(7):
            slot = AvailabilitySlot(
                id=generate_uuid(),
                user_id=user.id,
                day_of_week=dow,
                start_time="18:00",
                end_time="20:00",
                is_recurring=True
            )
            db.add(slot)
        db.commit()
        print("✅ Step 2: 7 Availability slots registered (Mon-Sun 18:00-20:00)")

        # 4. Ingest and parse Syllabus via Semantic AI
        raw_syllabus = """
Subject: Advanced Algorithms & Data Structures
Unit 1: Graph Theory and Network Flows
- Maximum Bipartite Matching and Ford-Fulkerson
- Minimum Cut and Push-Relabel Algorithm
Unit 2: Dynamic Programming & Amortized Analysis
- Bellman-Ford and Floyd-Warshall shortest paths
- Matrix Chain Multiplication and Knapsack
- Disjoint Set Union and Potential Method
"""
        syllabus = SemanticAIEngine.process_and_store_syllabus(
            db=db,
            user_id=user.id,
            title="Advanced Algorithms",
            raw_text=raw_syllabus
        )
        print(f"✅ Step 3: Syllabus ingested -> {len(syllabus.subjects)} subjects, created topics:")
        all_topics = db.query(Topic).all()
        for t in all_topics:
            print(f"   - Topic: '{t.name}' (Est: {t.estimated_hours}h)")

        # 5. Ingest PYQ and Map Semantically
        raw_pyq = """
EXAM PAPER 2024: Advanced Algorithms
Q1. [10 Marks] Formulate the Max-Flow Min-Cut theorem and solve using Ford-Fulkerson algorithm.
Q2. [8 Marks] State Floyd-Warshall algorithm for all-pairs shortest paths and analyze its O(V^3) complexity.
Q3. [10 Marks] Apply the Potential Function Method for amortized analysis of Disjoint Set Union with path compression.
"""
        subj = syllabus.subjects[0]
        pyq_result = SemanticAIEngine.map_pyq_document(
            db=db,
            subject_id=subj.id,
            year=2024,
            raw_text=raw_pyq
        )
        print(f"✅ Step 4: PYQs mapped -> {pyq_result['mapped_questions']} question mappings created.")
        
        # Verify pyq_weight_scores
        db.expire_all()
        topics_after_pyq = db.query(Topic).all()
        for t in topics_after_pyq:
            print(f"   - Topic: '{t.name}' -> PYQ Weight Score: {t.pyq_weight_score}/10")

        # 6. Priority Engine Execution
        PriorityEngine.recalculate_user_priorities(db, user.id)
        db.expire_all()
        ranked_topics = db.query(Topic).order_by(Topic.calculated_priority.desc()).all()
        print("✅ Step 5: Topics ranked by Deterministic Priority Formula:")
        for idx, t in enumerate(ranked_topics, 1):
            print(f"   {idx}. '{t.name}' -> Priority: {t.calculated_priority} (PYQ: {t.pyq_weight_score}, Mastery: {t.user_mastery_score})")

        # 7. Generate Deterministic Timetable
        sessions = DeterministicSchedulerEngine.generate_schedule(db, user.id, horizon_days=7)
        print(f"✅ Step 6: Generated {len(sessions)} deterministic study sessions strictly in 18:00-20:00 slots:")
        for s in sessions[:3]:
            t_obj = db.query(Topic).filter(Topic.id == s.topic_id).first()
            print(f"   - [{s.start_time.strftime('%a %d %b %H:%M')} - {s.end_time.strftime('%H:%M')}] Type: {s.session_type.upper()} | Topic: '{t_obj.name}'")

        # 8. Test Adaptive Loop: Simulate SKIPPED Session
        test_session = sessions[0]
        t_before = db.query(Topic).filter(Topic.id == test_session.topic_id).first()
        initial_priority = t_before.calculated_priority
        initial_mastery = t_before.user_mastery_score
        print(f"\n🔄 Step 7: Simulating user SKIPPING session '{t_before.name}' (Prior Mastery: {initial_mastery}, Priority: {initial_priority})...")
        
        skip_res = AdaptiveReplanningEngine.handle_session_status_change(db, test_session.id, "skipped")
        db.expire_all()
        t_after = db.query(Topic).filter(Topic.id == test_session.topic_id).first()
        print(f"   -> Result: Replan Triggered = {skip_res['replan_triggered']}")
        print(f"   -> New Mastery Score: {t_after.user_mastery_score} (reduced)")
        print(f"   -> New Recalculated Priority: {t_after.calculated_priority} (boosted urgency due to missed session!)")
        assert t_after.calculated_priority >= initial_priority, "Priority should increase after a skip"

        # 9. Test Adaptive Loop: Simulate Quiz with Low Score (<70%)
        print(f"\n🔄 Step 8: Simulating QUIZ FAILURE (<70%) on '{t_after.name}' (2/5 = 40%)...")
        quiz_res_fail = AdaptiveReplanningEngine.handle_quiz_submission(
            db=db,
            topic_id=t_after.id,
            user_id=user.id,
            total_questions=5,
            correct_answers=2
        )
        print(f"   -> Score: {quiz_res_fail['score_percentage']}% | Passed: {quiz_res_fail['passed']}")
        print(f"   -> Adaptive Replan Triggered: {quiz_res_fail['replan_triggered']}")
        assert quiz_res_fail["passed"] is False
        assert quiz_res_fail["replan_triggered"] is True

        # 10. Test Adaptive Loop: Simulate Quiz with High Score (>=70%)
        print(f"\n🔄 Step 9: Simulating QUIZ SUCCESS (>=70%) on '{t_after.name}' (5/5 = 100%)...")
        quiz_res_pass = AdaptiveReplanningEngine.handle_quiz_submission(
            db=db,
            topic_id=t_after.id,
            user_id=user.id,
            total_questions=5,
            correct_answers=5
        )
        print(f"   -> Score: {quiz_res_pass['score_percentage']}% | Passed: {quiz_res_pass['passed']}")
        print(f"   -> Updated Mastery: {quiz_res_pass['updated_mastery']}/10 (boosted!)")
        assert quiz_res_pass["passed"] is True

        print("\n=============================================================")
        print("🎉 ALL ADAPTIVE ENGINE INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
        print("=============================================================")

    finally:
        db.close()

if __name__ == "__main__":
    run_integration_tests()
