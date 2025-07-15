# museboard-ai-service/dspy_modules/onboarding.py

import dspy
from typing import List, Dict, Any, Optional
import json

class MissionCrafter(dspy.Module):
    """
    DSPy module for conversational mission crafting.
    Helps users refine and articulate their life mission through guided conversation.
    """
    
    def __init__(self):
        super().__init__()
        self.craft_mission = dspy.ChainOfThought(
            "current_mission, user_response, conversation_history -> refined_mission, next_question, mission_complete"
        )
        
    def forward(self, current_mission: str, user_response: str, conversation_history: str = "") -> dspy.Prediction:
        """
        Takes the current mission state, user's response, and conversation history
        to refine the mission and determine next steps.
        """
        
        # Create context for the mission crafting conversation
        context = f"""
        You are Shadow, an AI muse companion helping users articulate their deepest life mission.
        Your goal is to help them discover and refine what truly matters to them through thoughtful questions.
        
        Current Mission Draft: {current_mission or "Not yet defined"}
        User's Latest Response: {user_response}
        Conversation So Far: {conversation_history}
        
        Guidelines:
        - Ask thoughtful, deep questions that help uncover their core values and aspirations
        - Be encouraging and supportive while pushing them to think deeper
        - Help them move from vague to specific, from external to internal motivation
        - When their mission feels complete and authentic, set mission_complete to "true"
        - Keep responses conversational and warm, like a wise friend
        """
        
        return self.craft_mission(
            current_mission=current_mission,
            user_response=user_response,
            conversation_history=context
        )


class InterestSuggester(dspy.Module):
    """
    DSPy module for suggesting heroes, role models, and interests based on user's mission.
    """
    
    def __init__(self):
        super().__init__()
        self.suggest_interests = dspy.ChainOfThought(
            "mission_statement -> hero_suggestions, interest_categories, reasoning"
        )
        
    def forward(self, mission_statement: str) -> dspy.Prediction:
        """
        Analyzes the user's mission to suggest relevant heroes and interest categories.
        """
        
        context = f"""
        Based on this user's mission: "{mission_statement}"
        
        Suggest 8-10 inspiring figures (entrepreneurs, athletes, artists, leaders, etc.) who embody
        similar values or have pursued similar paths. Include both well-known and lesser-known figures.
        
        Also suggest 5-6 broad interest categories that align with their mission.
        
        Format your response as JSON:
        {{
            "heroes": [
                {{"name": "Person Name", "reason": "Why they're relevant to this mission"}},
                ...
            ],
            "interests": [
                {{"category": "Category Name", "description": "Why this matters for their mission"}},
                ...
            ],
            "reasoning": "Overall reasoning for these suggestions"
        }}
        
        Focus on diversity in backgrounds, industries, and approaches while maintaining relevance.
        """
        
        return self.suggest_interests(mission_statement=context)


class ContentCurator(dspy.Module):
    """
    DSPy module for curating external content based on mission and interests.
    This will be enhanced in Phase 3.3 with actual web search capabilities.
    """
    
    def __init__(self):
        super().__init__()
        self.curate_content = dspy.ChainOfThought(
            "mission, heroes, interests -> content_suggestions, categories"
        )
        
    def forward(self, mission: str, heroes: List[str], interests: List[str]) -> dspy.Prediction:
        """
        Suggests content that would be valuable for pre-populating the user's Museboard.
        """
        
        heroes_str = ", ".join(heroes)
        interests_str = ", ".join(interests)
        
        context = f"""
        User's Mission: {mission}
        Their Heroes: {heroes_str}
        Their Interests: {interests_str}
        
        Create 10-15 pieces of inspirational content that would perfectly fit their Museboard.
        Include quotes, insights, principles, and actionable advice from their heroes or related to their interests.
        
        Format as JSON:
        {{
            "content": [
                {{
                    "type": "quote",
                    "content": "The actual quote or insight",
                    "source": "Who said it or where it's from",
                    "category": "Suggested category",
                    "relevance_reason": "Why this matters for their mission"
                }},
                ...
            ],
            "categories": ["List of suggested categories for organization"]
        }}
        
        Make these deeply relevant and inspirational - content they'd genuinely want to remember and revisit.
        """
        
        return self.curate_content(
            mission=mission,
            heroes=heroes_str,
            interests=interests_str
        )


# New signatures for the onboarding modules
class MissionCraftingSignature(dspy.Signature):
    """Helps users craft and refine their life mission through conversation."""
    
    current_mission = dspy.InputField(desc="The current state of the user's mission")
    user_response = dspy.InputField(desc="The user's latest response in the conversation")
    conversation_history = dspy.InputField(desc="Previous conversation context")
    
    refined_mission = dspy.OutputField(desc="Updated/refined version of their mission")
    next_question = dspy.OutputField(desc="Next question to ask them")
    mission_complete = dspy.OutputField(desc="'true' if mission is complete, 'false' if needs more work")


class InterestSuggestionSignature(dspy.Signature):
    """Suggests heroes and interests based on user's mission."""
    
    mission_statement = dspy.InputField(desc="The user's refined mission statement")
    
    hero_suggestions = dspy.OutputField(desc="JSON list of suggested heroes/role models")
    interest_categories = dspy.OutputField(desc="JSON list of relevant interest categories")
    reasoning = dspy.OutputField(desc="Explanation of why these suggestions fit their mission")


class ContentCurationSignature(dspy.Signature):
    """Curates inspirational content for pre-populating user's Museboard."""
    
    mission = dspy.InputField(desc="User's mission statement")
    heroes = dspy.InputField(desc="List of their selected heroes")
    interests = dspy.InputField(desc="List of their selected interests")
    
    content_suggestions = dspy.OutputField(desc="JSON array of curated content pieces")
    categories = dspy.OutputField(desc="Suggested categories for organization")