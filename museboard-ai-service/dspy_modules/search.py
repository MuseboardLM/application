# museboard-ai-service/dspy_modules/search.py
import dspy
from core.config import supabase, openai_client

class GenerateAnswer(dspy.Signature):
    """Answer the user's question based *only* on the provided context from their Museboard.
    Synthesize the information from the context into a cohesive answer."""
    context = dspy.InputField(desc="Relevant items from the user's Museboard.")
    question = dspy.InputField(desc="The user's original question.")
    answer = dspy.OutputField(desc="A comprehensive answer synthesized from the context.")

class RAG(dspy.Module):
    def __init__(self):
        super().__init__()
        self.generate_answer = dspy.ChainOfThought(GenerateAnswer)

    def _generate_embedding(self, text: str):
        text = text.replace("\n", " ")
        response = openai_client.embeddings.create(input=[text], model="text-embedding-3-small")
        return response.data[0].embedding

    def forward(self, question, user_id):
        question_embedding = self._generate_embedding(question)
        
        retrieved_context = supabase.rpc('match_muse_items', {
            'query_embedding': question_embedding, 'match_threshold': 0.70, 
            'match_count': 5, 'p_user_id': user_id
        }).execute()
        
        if not retrieved_context.data:
            return dspy.Prediction(answer="I couldn't find any relevant items in your Museboard for that query.", sources=[])

        context_str = "\n\n---\n\n".join([
            f"Type: {item['content_type']}\nContent: {item['content'][:500]}\nDescription: {item.get('description', '') or 'N/A'}" 
            for item in retrieved_context.data
        ])

        prediction = self.generate_answer(context=context_str, question=question)
        
        return dspy.Prediction(answer=prediction.answer, sources=retrieved_context.data)