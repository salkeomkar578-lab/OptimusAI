import os
import logging
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from app.config import settings
from app.services.ai_gateway import ai_gateway

logger = logging.getLogger("optimus.ai_settings")
router = APIRouter(prefix="/ai", tags=["AI Configuration"])

class AIConfigRequest(BaseModel):
    provider: str # "gemini", "groq", "openai", "auto"
    api_key: Optional[str] = None

class AITestRequest(BaseModel):
    provider: Optional[str] = None
    api_key: Optional[str] = None

@router.get("/status")
def get_ai_status():
    ai_gateway.refresh_keys()
    gemini_has_key = bool(settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"))
    groq_has_key = bool(settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY"))
    openai_has_key = bool(settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY"))

    active = settings.AI_PROVIDER
    if active == "auto":
        if gemini_has_key:
            active = "gemini"
        elif groq_has_key:
            active = "groq"
        elif openai_has_key:
            active = "openai"
        else:
            active = "semantic_nlp"

    return {
        "status": "online",
        "active_provider": active,
        "configured_providers": {
            "gemini": gemini_has_key,
            "groq": groq_has_key,
            "openai": openai_has_key,
            "semantic_nlp": True
        },
        "available_providers": [
            {"id": "gemini", "name": "Google Gemini (Recommended)", "models": ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]},
            {"id": "groq", "name": "Groq LLaMA 3.3", "models": ["llama-3.3-70b-versatile"]},
            {"id": "openai", "name": "OpenAI GPT-4o-mini", "models": ["gpt-4o-mini"]},
            {"id": "semantic_nlp", "name": "Smart Semantic NLP Engine (No Key Required)", "models": ["optimus-dense-vector-v1"]}
        ]
    }

@router.post("/configure")
def configure_ai(payload: AIConfigRequest):
    provider = payload.provider.lower()
    if payload.api_key:
        settings.set_ai_key(provider, payload.api_key.strip())
        ai_gateway.refresh_keys()

    # Test the configured provider
    test_result = "Configured successfully"
    if payload.api_key:
        try:
            if provider == "gemini":
                reply = ai_gateway._call_gemini("Reply with only the word: CONNECTED", "You are a test ping bot.")
            elif provider == "groq":
                reply = ai_gateway._call_groq("Reply with only the word: CONNECTED", "You are a test ping bot.")
            elif provider == "openai":
                reply = ai_gateway._call_openai("Reply with only the word: CONNECTED", "You are a test ping bot.")
            else:
                reply = "CONNECTED"

            if not reply:
                return {
                    "status": "warning",
                    "message": f"Saved {provider.upper()} key, but test ping returned empty response. Please verify the key has active quota and permissions.",
                    "active_provider": provider
                }
            test_result = f"Successfully authenticated with {provider.upper()}!"
        except Exception as e:
            return {
                "status": "error",
                "message": f"Connection failed with {provider.upper()}: {str(e)}",
                "active_provider": provider
            }

    return {
        "status": "success",
        "message": test_result,
        "active_provider": provider
    }

@router.post("/test")
def test_ai(payload: AITestRequest):
    ai_gateway.refresh_keys()
    prov = (payload.provider or settings.AI_PROVIDER).lower()
    
    if payload.api_key:
        settings.set_ai_key(prov, payload.api_key.strip())
        ai_gateway.refresh_keys()

    prompt = "In 2 sentences, explain why organized syllabus hierarchy improves study retention."
    reply = ai_gateway.call_llm(prompt, "You are OptimusAI.")
    
    if reply:
        return {
            "status": "success",
            "provider_used": prov,
            "response": reply
        }
    
    # Fallback response
    return {
        "status": "fallback",
        "provider_used": "semantic_nlp",
        "response": "Organized syllabus hierarchies break complex concepts into manageable chunks, optimizing cognitive load and spaced retention intervals."
    }
