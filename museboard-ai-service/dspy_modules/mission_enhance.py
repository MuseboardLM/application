# museboard-ai-service/dspy_modules/mission_enhance.py

import dspy

class MissionEnhancer(dspy.Module):
    """
    Simple DSPy module for enhancing user mission statements.
    Takes raw user input and refines it into a clear, inspiring mission.
    """
    
    def __init__(self):
        super().__init__()
        self.enhance = dspy.ChainOfThought(
            "user_input -> mission"
        )
        
    def forward(self, user_input: str) -> dspy.Prediction:
        """
        Takes user's raw input and enhances it into a refined mission statement.
        """
        
        context = f"""
        You are Shadow, an AI muse for MuseboardLM. Your job is to take a user's raw input about their goals/dreams and craft it into a clear, inspiring mission statement.

        User's input: "{user_input}"

        Rules:
        - Keep it under 20 words when possible
        - Make it inspiring and personal 
        - Focus on the outcome/impact they want to create
        - Use active language
        - If their input is already clear, you can return it with minor refinements
        - If it's vague, ask ONE clarifying question max and then enhance based on what they gave you

        Examples:
        Input: "Help solo founders succeed" → Mission: "Help solo founders build profitable products"
        Input: "I want to be a better leader" → Mission: "Become a leader who inspires teams to achieve extraordinary results"
        Input: "Create art" → Mission: "Create meaningful art that moves people and sparks conversations"

        Return the enhanced mission statement.
        """
        
        return self.enhance(user_input=context)

class MissionEnhancerSignature(dspy.Signature):
    """Enhances user input into a clear mission statement."""
    
    user_input = dspy.InputField(desc="The user's raw input about their goals/mission")
    mission = dspy.OutputField(desc="A refined, inspiring mission statement under 20 words")