# museboard-ai-service/dspy_modules/chat.py

import dspy

class GenerateShadowResponse(dspy.Signature):
    """
    Act as Shadow, an AI thinking partner. Your tone must be deterministic, focused, and precise. 
    Avoid conversational fillers or speculation. Provide direct, actionable insights.

    Given the user's mission, their recent activity, and their latest message, generate a helpful response.
    """
    mission = dspy.InputField(desc="The user's overarching personal mission statement.")
    context = dspy.InputField(desc="A summary of the user's recent Museboard items and conversation history.")
    question = dspy.InputField(desc="The user's most recent message to Shadow.")
    
    response = dspy.OutputField(desc="A concise and focused response from Shadow that is directly helpful.")

class ShadowAgent(dspy.Module):
    def __init__(self):
        super().__init__()
        # Use ChainOfThought to encourage the LM to reason before responding
        self.generate_response = dspy.ChainOfThought(GenerateShadowResponse)

    def forward(self, mission, question, recent_items_summary, history_summary):
        # We synthesize the context into a more digestible format for the LM
        context_str = f"CONVERSATION HISTORY:\n{history_summary}\n\nMUSEBOARD SUMMARY:\n{recent_items_summary}"
        
        prediction = self.generate_response(
            mission=mission,
            context=context_str,
            question=question
        )
        
        return prediction