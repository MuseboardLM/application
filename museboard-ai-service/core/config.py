# museboard-ai-service/core/config.py

import os
import dspy
import openai
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv()

# --- OpenAI Client Configuration ---
# Create a single, reusable OpenAI client instance for direct calls (e.g., embeddings)
# This remains correct and is essential for our backfill script.
openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --- DSPy Configuration (Corrected for DSPy 3.0) ---
# Set up the language model (LM) for DSPy using the modern, unified dspy.LM class.
# This matches the official documentation.
gpt4o = dspy.LM(
    'openai/gpt-4o',
    api_key=os.getenv("OPENAI_API_KEY"),
    max_tokens=4000
)

# Set the configured LM as the default for all DSPy modules
dspy.configure(lm=gpt4o)


# --- Supabase Configuration ---
# This remains correct
supabase_url: str = os.environ.get("SUPABASE_URL")
supabase_key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Create a single, reusable Supabase client instance
supabase: Client = create_client(supabase_url, supabase_key)