# museboard-ai-service/core/models.py

from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any

# A direct translation of your TypeScript AIMessage type
class AIMessage(BaseModel):
    id: str
    conversation_id: str
    role: Literal["user", "assistant", "system"]
    content: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: str

# A direct translation of your TypeScript MuseItem type
class MuseItem(BaseModel):
    id: str
    user_id: str
    content: str
    content_type: str
    created_at: str
    ai_categories: Optional[List[str]] = None
    # Add other fields as needed for context...

# A direct translation of your TypeScript ShadowContext type
class ShadowContext(BaseModel):
    mission: str
    recentItems: List[MuseItem]
    totalItems: int
    topCategories: List[str]
    conversationHistory: List[AIMessage]

# This is the expected request body for our main chat endpoint
class ShadowChatRequest(BaseModel):
    context: ShadowContext
    user_message: str = Field(..., min_length=1)
    conversation_id: str