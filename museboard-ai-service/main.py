# museboard-ai-service/main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import json

# Make sure your imports align with your project structure
# from core.config import supabase
from dspy_modules.chat import ShadowAgent
from dspy_modules.search import RAG
from dspy_modules.mission_enhance import MissionEnhancer
from dspy_modules.onboarding import InterestSuggester 

app = FastAPI()

# --- Initialize DSPy Modules ---
shadow_agent = ShadowAgent()
rag_agent = RAG()
mission_enhancer = MissionEnhancer()
interest_suggester = InterestSuggester()

# --- Pydantic Models for API Contracts ---
class ChatRequest(BaseModel):
    context: Dict
    user_message: str
    conversation_id: str

class SearchRequest(BaseModel):
    query: str
    user_id: str

class MissionEnhanceRequest(BaseModel):
    user_input: str
    
class SuggestionRequest(BaseModel):
    mission: str

class ContentCurationRequest(BaseModel):
    mission: str
    heroes: Optional[List[str]] = []
    interests: Optional[List[str]] = []

# --- API Endpoints ---

@app.get("/")
def health_check():
    return {"status": "ok", "service": "museboard-ai-service"}

@app.post("/api/v1/shadow/chat")
async def chat_with_shadow(request: ChatRequest):
    # Your existing chat logic
    try:
        user_context = request.context
        history_summary = "\n".join([f"{msg.get('role')}: {msg.get('content')}" for msg in user_context.get('conversationHistory', [])])
        recent_items_summary = f"User has {user_context.get('totalItems', 0)} items. Recent themes: {', '.join(user_context.get('topCategories', []))}"
        
        prediction = shadow_agent(
            mission=user_context.get('mission', ''),
            question=request.user_message,
            recent_items_summary=recent_items_summary,
            history_summary=history_summary
        )
        
        return {"response": prediction.response}
    except Exception as e:
        print(f"Error in chat_with_shadow: {e}")
        raise HTTPException(status_code=500, detail="AI service error during chat.")

@app.post("/api/v1/shadow/search")
async def search_museboard(request: SearchRequest):
    # Your existing RAG search logic
    try:
        prediction = rag_agent(question=request.query, user_id=request.user_id)
        return {"answer": prediction.answer, "sources": prediction.sources}
    except Exception as e:
        print(f"Error in search_museboard: {e}")
        raise HTTPException(status_code=500, detail="AI service error during search.")

@app.post("/api/v1/onboarding/mission/enhance")
async def enhance_mission(request: MissionEnhanceRequest):
    # Your existing mission enhancement logic
    try:
        prediction = mission_enhancer(user_input=request.user_input)
        return {"mission": prediction.mission, "enhanced": True}
    except Exception as e:
        print(f"Error in enhance_mission: {e}")
        return {"mission": request.user_input, "enhanced": False}

# --- 👇 THIS ENDPOINT IS UPDATED ---
@app.post("/api/v1/onboarding/suggestions")
async def get_inspiration_suggestions(request: SuggestionRequest):
    """
    Generates hero and interest suggestions based on a mission statement.
    """
    if not request.mission or not request.mission.strip():
        raise HTTPException(status_code=400, detail="Mission statement is required.")
        
    try:
        prediction = interest_suggester(mission_statement=request.mission)
        
        # Access the single, more reliable JSON output field
        raw_suggestions = prediction.suggestions_json
        
        suggestions = json.loads(raw_suggestions)
        return {
            "heroes": suggestions.get("heroes", []),
            "interests": suggestions.get("interests", []),
        }
    except json.JSONDecodeError:
        # Better error logging to see what the AI returned if it's not valid JSON
        invalid_output = getattr(prediction, 'suggestions_json', 'N/A')
        print(f"AI service did not return valid JSON for mission: '{request.mission}'. Received: {invalid_output}")
        raise HTTPException(status_code=500, detail="AI service returned an invalid format.")
    except Exception as e:
        print(f"Error in get_inspiration_suggestions: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while generating suggestions.")

@app.post("/api/v1/onboarding/content/curate")
async def curate_content(request: ContentCurationRequest):
    # Your existing content curation logic
    try:
        # This can be replaced with your ContentCurator DSPy module call later
        # For now, using the fallback logic is fine
        fallback_content = [
            {"type": "quote", "content": "The only way to do great work is to love what you do.", "source": "Steve Jobs", "category": "Passion", "relevance_reason": "Aligns passion with purpose."},
            {"type": "quote", "content": "Success is not final, failure is not fatal: it is the courage to continue that counts.", "source": "Winston Churchill", "category": "Resilience", "relevance_reason": "Persistence is key."}
        ]
        return {"content": fallback_content}
    except Exception as e:
        print(f"Error in curate_content: {e}")
        raise HTTPException(status_code=500, detail="AI service error during content curation.")