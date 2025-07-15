# museboard-ai-service/main.py (Updated)

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
from core.config import supabase
from dspy_modules.chat import ShadowAgent
from dspy_modules.search import RAG
from dspy_modules.mission_enhance import MissionEnhancer

app = FastAPI()

# Initialize all DSPy modules
shadow_agent = ShadowAgent()
rag_agent = RAG()
mission_enhancer = MissionEnhancer()

# Existing models
class ChatRequest(BaseModel):
    context: dict
    user_message: str
    conversation_id: str

class SearchRequest(BaseModel):
    query: str
    user_id: str

# New mission enhancement model
class MissionEnhanceRequest(BaseModel):
    user_input: str

# Content curation model (simplified)
class ContentCurationRequest(BaseModel):
    mission: str
    heroes: Optional[List[str]] = []
    interests: Optional[List[str]] = []

# Existing endpoints
@app.post("/api/v1/shadow/chat")
async def chat_with_shadow(request: ChatRequest):
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
        
        ai_response_text = prediction.response
        
        # Save to database
        messages_to_save = [
            {'role': 'user', 'content': request.user_message, 'conversation_id': request.conversation_id},
            {'role': 'assistant', 'content': ai_response_text, 'conversation_id': request.conversation_id}
        ]
        
        try:
            supabase.from_("ai_messages").insert(messages_to_save).execute()
        except Exception as db_error:
            print(f"Database Error: Failed to save conversation. {db_error}")
        
        return {"response": ai_response_text}
    except Exception as e:
        print(f"An error occurred in chat_with_shadow: {e}")
        raise HTTPException(status_code=500, detail="An error occurred in the AI service.")

@app.post("/api/v1/shadow/search")
async def search_museboard(request: SearchRequest):
    try:
        prediction = rag_agent(question=request.query, user_id=request.user_id)
        return {"answer": prediction.answer, "sources": prediction.sources}
    except Exception as e:
        print(f"An error occurred in search_museboard: {e}")
        raise HTTPException(status_code=500, detail="An error occurred during search.")

# New streamlined mission enhancement endpoint
@app.post("/api/v1/onboarding/mission/enhance")
async def enhance_mission(request: MissionEnhanceRequest):
    try:
        prediction = mission_enhancer(user_input=request.user_input)
        
        return {
            "mission": prediction.mission,
            "enhanced": True
        }
    except Exception as e:
        print(f"An error occurred in enhance_mission: {e}")
        # Graceful fallback
        return {
            "mission": request.user_input,
            "enhanced": False
        }

# Simplified content curation endpoint
@app.post("/api/v1/onboarding/content/curate")
async def curate_content(request: ContentCurationRequest):
    try:
        # For now, return curated content based on mission
        # You can enhance this later with more sophisticated logic
        
        mission_keywords = request.mission.lower()
        
        # Simple keyword-based content selection
        fallback_content = [
            {
                "type": "quote",
                "content": "The way to get started is to quit talking and begin doing.",
                "source": "Walt Disney",
                "category": "Action",
                "relevance_reason": "Emphasizes taking action toward your goals"
            },
            {
                "type": "quote",
                "content": "Success is not final, failure is not fatal: it is the courage to continue that counts.",
                "source": "Winston Churchill",
                "category": "Resilience", 
                "relevance_reason": "Reminds us that persistence is key to achieving our mission"
            },
            {
                "type": "principle",
                "content": "Focus on being productive instead of busy.",
                "source": "Tim Ferriss",
                "category": "Productivity",
                "relevance_reason": "Helps maintain focus on what truly matters for your mission"
            },
            {
                "type": "quote",
                "content": "The only way to do great work is to love what you do.",
                "source": "Steve Jobs",
                "category": "Passion",
                "relevance_reason": "Aligns passion with purpose in pursuit of your goals"
            },
            {
                "type": "quote",
                "content": "Innovation distinguishes between a leader and a follower.",
                "source": "Steve Jobs", 
                "category": "Innovation",
                "relevance_reason": "Highlights the value of creative thinking and leadership"
            }
        ]
        
        # Add mission-specific content if certain keywords are present
        if any(word in mission_keywords for word in ['build', 'create', 'product', 'business']):
            fallback_content.append({
                "type": "insight",
                "content": "Build something people want.",
                "source": "Paul Graham (Y Combinator)",
                "category": "Entrepreneurship",
                "relevance_reason": "Core principle for anyone building products or businesses"
            })
        
        if any(word in mission_keywords for word in ['help', 'serve', 'impact', 'change']):
            fallback_content.append({
                "type": "quote",
                "content": "The best way to find yourself is to lose yourself in the service of others.",
                "source": "Mahatma Gandhi",
                "category": "Service",
                "relevance_reason": "Reminds us that helping others is a path to fulfillment"
            })
        
        return {
            "content": fallback_content,
            "categories": ["Action", "Innovation", "Resilience", "Productivity", "Passion"]
        }
        
    except Exception as e:
        print(f"An error occurred in curate_content: {e}")
        raise HTTPException(status_code=500, detail="An error occurred during content curation.")

@app.get("/")
def health_check():
    return {"status": "ok", "service": "museboard-ai", "version": "2.1"}