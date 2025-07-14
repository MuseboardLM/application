# In museboard-ai-service/main.py

from fastapi import FastAPI, HTTPException
from core.models import ShadowChatRequest
from core.config import supabase
from dspy_modules.chat import ShadowAgent

app = FastAPI()

shadow_agent = ShadowAgent()

@app.post("/api/v1/shadow/chat")
async def chat_with_shadow(request: ShadowChatRequest):
    """
    This endpoint is the main entry point for the Shadow AI chat.
    It receives the user's context and message, generates a response using DSPy,
    and saves the conversation turn to Supabase.
    """
    try:
        # 1. Prepare inputs for the DSPy module
        user_context = request.context
        history_summary = "\n".join([f"{msg.role}: {msg.content}" for msg in user_context.conversationHistory])
        recent_items_summary = f"User has {user_context.totalItems} items. Recent themes: {', '.join(user_context.topCategories)}"

        # 2. Run the DSPy program
        prediction = shadow_agent(
            mission=user_context.mission,
            question=request.user_message,
            recent_items_summary=recent_items_summary,
            history_summary=history_summary
        )
        ai_response_text = prediction.response

        # 3. Save the conversation turn to the database
        messages_to_save = [
            {'role': 'user', 'content': request.user_message, 'conversation_id': request.conversation_id},
            {'role': 'assistant', 'content': ai_response_text, 'conversation_id': request.conversation_id}
        ]
        
        # --- ✨ FIX: Use a try/except block for the synchronous database call ---
        try:
            supabase.from_("ai_messages").insert(messages_to_save).execute()
        except Exception as db_error:
            # If the DB save fails, we log the error but still return the AI response to the user
            print(f"Database Error: Failed to save conversation. {db_error}")
            
        return {"response": ai_response_text}

    except Exception as e:
        print(f"An error occurred in chat_with_shadow: {e}")
        raise HTTPException(status_code=500, detail="An error occurred in the AI service.")

@app.get("/")
def health_check():
    return {"status": "ok", "service": "museboard-ai"}