import uuid
from datetime import datetime, time
from typing import Optional, List
from sqlalchemy import (
    Column, String, Text, Float, Integer, Boolean, DateTime, Time, ForeignKey
)
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field
from app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

# ============================================================================
# SQLAlchemy ORM Models
# ============================================================================

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    target_exam_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    syllabi = relationship("Syllabus", back_populates="user", cascade="all, delete-orphan")
    availability_slots = relationship("AvailabilitySlot", back_populates="user", cascade="all, delete-orphan")
    study_sessions = relationship("StudySession", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")


class Syllabus(Base):
    __tablename__ = "syllabi"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    raw_file_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="syllabi")
    subjects = relationship("Subject", back_populates="syllabus", cascade="all, delete-orphan")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    syllabus_id = Column(String(36), ForeignKey("syllabi.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    order_index = Column(Integer, default=0)

    syllabus = relationship("Syllabus", back_populates="subjects")
    units = relationship("Unit", back_populates="subject", cascade="all, delete-orphan")
    pyq_documents = relationship("PYQDocument", back_populates="subject", cascade="all, delete-orphan")


class Unit(Base):
    __tablename__ = "units"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    order_index = Column(Integer, default=0)

    subject = relationship("Subject", back_populates="units")
    topics = relationship("Topic", back_populates="unit", cascade="all, delete-orphan")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    unit_id = Column(String(36), ForeignKey("units.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    estimated_hours = Column(Float, default=2.0)
    
    # Priority & Adaptive Scores
    pyq_weight_score = Column(Float, default=0.0)      # 0.0 to 10.0
    user_mastery_score = Column(Float, default=0.0)    # 0.0 to 10.0
    calculated_priority = Column(Float, default=0.0, index=True)
    
    last_studied_at = Column(DateTime, nullable=True)
    next_revision_due = Column(DateTime, nullable=True)
    embedding_json = Column(Text, nullable=True)       # Serialized vector representation

    unit = relationship("Unit", back_populates="topics")
    pyq_mappings = relationship("TopicPYQMapping", back_populates="topic", cascade="all, delete-orphan")
    study_sessions = relationship("StudySession", back_populates="topic", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="topic", cascade="all, delete-orphan")


class PYQDocument(Base):
    __tablename__ = "pyq_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    file_url = Column(Text, nullable=True)
    year = Column(Integer, nullable=False)
    extracted_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    subject = relationship("Subject", back_populates="pyq_documents")
    mappings = relationship("TopicPYQMapping", back_populates="pyq_document", cascade="all, delete-orphan")


class TopicPYQMapping(Base):
    __tablename__ = "topic_pyq_mappings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    pyq_id = Column(String(36), ForeignKey("pyq_documents.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    relevance_score = Column(Float, default=0.0)
    weight = Column(Float, default=1.0)
    embedding_json = Column(Text, nullable=True)

    topic = relationship("Topic", back_populates="pyq_mappings")
    pyq_document = relationship("PYQDocument", back_populates="mappings")


class AvailabilitySlot(Base):
    __tablename__ = "availability_slots"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    day_of_week = Column(Integer, nullable=False)      # 0=Sunday, 1=Monday... 6=Saturday
    start_time = Column(String(8), nullable=False)      # "HH:MM" e.g. "18:00"
    end_time = Column(String(8), nullable=False)        # "HH:MM" e.g. "20:00"
    is_recurring = Column(Boolean, default=True)

    user = relationship("User", back_populates="availability_slots")


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String(50), default="scheduled")    # 'scheduled', 'completed', 'skipped', 'rescheduled'
    session_type = Column(String(50), default="study")  # 'study', 'revision', 'quiz'
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="study_sessions")
    topic = relationship("Topic", back_populates="study_sessions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False)
    score_percentage = Column(Float, nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)

    topic = relationship("Topic", back_populates="quiz_attempts")
    user = relationship("User", back_populates="quiz_attempts")


# ============================================================================
# Pydantic Schemas for Request & Response validation
# ============================================================================

class UserBase(BaseModel):
    email: str
    name: str
    target_exam_date: datetime

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True


class AvailabilitySlotCreate(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6, description="0=Sun, 1=Mon, ..., 6=Sat")
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    is_recurring: bool = True

class AvailabilitySlotResponse(AvailabilitySlotCreate):
    id: str
    user_id: str
    class Config:
        from_attributes = True


class TopicResponse(BaseModel):
    id: str
    unit_id: str
    name: str
    description: Optional[str] = None
    estimated_hours: float
    pyq_weight_score: float
    user_mastery_score: float
    calculated_priority: float
    last_studied_at: Optional[datetime] = None
    next_revision_due: Optional[datetime] = None
    pyq_count: Optional[int] = 0

    class Config:
        from_attributes = True


class UnitResponse(BaseModel):
    id: str
    subject_id: str
    name: str
    order_index: int
    topics: List[TopicResponse] = []

    class Config:
        from_attributes = True


class SubjectResponse(BaseModel):
    id: str
    syllabus_id: str
    name: str
    order_index: int
    units: List[UnitResponse] = []

    class Config:
        from_attributes = True


class SyllabusResponse(BaseModel):
    id: str
    user_id: str
    title: str
    raw_file_url: Optional[str] = None
    created_at: datetime
    subjects: List[SubjectResponse] = []

    class Config:
        from_attributes = True


class StudySessionResponse(BaseModel):
    id: str
    user_id: str
    topic_id: str
    topic_name: Optional[str] = None
    subject_name: Optional[str] = None
    start_time: datetime
    end_time: datetime
    status: str
    session_type: str
    calculated_priority: Optional[float] = 0.0

    class Config:
        from_attributes = True


class SessionUpdateStatusRequest(BaseModel):
    status: str = Field(..., pattern="^(scheduled|completed|skipped|rescheduled)$")


class QuizSubmissionRequest(BaseModel):
    topic_id: str
    user_id: str
    answers: List[dict] # [{ question_id: 1, selected_option: 0, is_correct: True }]


class QuizQuestion(BaseModel):
    id: int
    question: str
    options: List[str]
    correct_index: int
    explanation: str


class StudyNotesResponse(BaseModel):
    topic_id: str
    topic_name: str
    key_points: List[str]
    core_formulas: List[str]
    definitions: List[dict]
    concept_diagram_mermaid: str
    recommended_reading: List[str]


class TutorChatRequest(BaseModel):
    topic_id: str
    message: str
    conversation_history: Optional[List[dict]] = []
