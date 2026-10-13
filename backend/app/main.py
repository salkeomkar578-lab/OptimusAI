import os
from datetime import datetime, timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routes import users, syllabus, pyq, planner, study, analytics
from app.models.schemas import User, AvailabilitySlot, generate_uuid
from app.engines.semantic_ai import SemanticAIEngine
from app.engines.scheduler import DeterministicSchedulerEngine

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="OptimusAI: Continuous Adaptive AI Study & Exam Preparation Platform"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(syllabus.router, prefix=settings.API_V1_STR)
app.include_router(pyq.router, prefix=settings.API_V1_STR)
app.include_router(planner.router, prefix=settings.API_V1_STR)
app.include_router(study.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": "OptimusAI Backend Engine",
        "status": "online",
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Demo Seeder Function
def seed_demo_data():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "student@optimus.ai").first()
        if not user:
            print("[OptimusAI] Initializing seed data for demo student...")
            exam_date = datetime.utcnow() + timedelta(days=21)
            user = User(
                id="demo-user-1",
                email="student@optimus.ai",
                name="Alex Chen",
                target_exam_date=exam_date,
                created_at=datetime.utcnow()
            )
            db.add(user)
            db.commit()

            # Add default availability slots: Mon to Sun 18:00 to 20:00
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

            # Seed Course Syllabus
            sample_syllabus_text = """
Course: Distributed Systems & Cloud Infrastructure
Unit 1: Foundations of Distributed Systems
- Distributed System Architecture & Failure Models
- Logical Clocks and Event Ordering (Lamport & Vector)
- Remote Procedure Calls & Serialization Protocols
Unit 2: Consensus, Synchronization & State
- Paxos and Raft Consensus Protocols
- Distributed Mutual Exclusion and Election Algorithms
- CAP Theorem, PACELC, and Eventual Consistency
Unit 3: Storage, Scalability & Security
- Distributed Hash Tables and Dynamo Style Key-Value Stores
- Byzantine Fault Tolerance & Quorum Systems
- Cloud Containerization, cgroups, and Microservices Security
"""
            syl = SemanticAIEngine.process_and_store_syllabus(
                db=db,
                user_id=user.id,
                title="Distributed Systems & Cloud Infrastructure",
                raw_text=sample_syllabus_text
            )

            # Map sample PYQ questions to subjects
            if syl.subjects:
                subj = syl.subjects[0]
                pyq_sample_text = """
EXAMINATION 2024: Distributed Systems
Q1. [10 Marks] State Lamport logical timestamp axioms. How do vector clocks overcome total order limitations?
Q2. [10 Marks] Detail the Raft consensus algorithm phases for Leader Election and Log Replication.
Q3. [8 Marks] Explain the CAP Theorem and discuss real-world tradeoffs in distributed key-value databases.
Q4. [6 Marks] How does Byzantine Fault Tolerance prevent malicious or corrupt node failures?
Q5. [8 Marks] Compare container virtualization security with hypervisor virtualization.
"""
                SemanticAIEngine.map_pyq_document(
                    db=db,
                    subject_id=subj.id,
                    year=2024,
                    raw_text=pyq_sample_text
                )

            # Generate initial schedule
            DeterministicSchedulerEngine.generate_schedule(
                db=db,
                user_id=user.id,
                horizon_days=14
            )
            print("[OptimusAI] Seed data created successfully!")
    finally:
        db.close()

@app.on_event("startup")
def on_startup():
    seed_demo_data()
