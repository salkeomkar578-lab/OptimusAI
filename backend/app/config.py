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
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    
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

    def set_ai_key(self, provider: str, key: str):
        provider = provider.lower()
        if provider == "gemini":
            self.GEMINI_API_KEY = key
            os.environ["GEMINI_API_KEY"] = key
        elif provider == "groq":
            self.GROQ_API_KEY = key
            os.environ["GROQ_API_KEY"] = key
        elif provider == "openai":
            self.OPENAI_API_KEY = key
            os.environ["OPENAI_API_KEY"] = key
        self.AI_PROVIDER = provider

        # Attempt to persist to .env
        try:
            env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
            lines = []
            if os.path.exists(env_path):
                with open(env_path, "r", encoding="utf-8") as f:
                    lines = f.readlines()
            key_var = f"{provider.upper()}_API_KEY"
            new_line = f"{key_var}={key}\n"
            replaced = False
            for i, line in enumerate(lines):
                if line.startswith(f"{key_var}="):
                    lines[i] = new_line
                    replaced = True
                    break
            if not replaced:
                lines.append(new_line)
            with open(env_path, "w", encoding="utf-8") as f:
                f.writelines(lines)
        except Exception:
            pass

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
