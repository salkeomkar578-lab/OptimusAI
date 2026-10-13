import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "OptimusAI Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./optimus.db")
    
    # AI Provider Keys
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY")
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    
    # Active AI Provider: "auto", "groq", "openai", "gemini", or "mock"
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "auto")
    
    # Priority Formula Weights (w1 * PYQ + w2 * Weakness + w3 * Urgency + w4 * Overdue Penalty)
    WEIGHT_PYQ: float = 0.35
    WEIGHT_WEAKNESS: float = 0.30
    WEIGHT_URGENCY: float = 0.20
    WEIGHT_OVERDUE: float = 0.15
    
    # Spaced Repetition Days
    SPACED_REPETITION_DAYS: list[int] = [1, 3, 7, 14]
    
    # Upload storage directory for local fallback
    UPLOAD_DIR: str = "./uploads"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
