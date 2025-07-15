# museboard-ai-service/backfill_embeddings.py

import os
import time
from dotenv import load_dotenv
from supabase import create_client, Client
import openai

def setup_clients():
    """Loads environment variables and sets up Supabase and OpenAI clients."""
    load_dotenv()
    
    # Configure and create an OpenAI client instance
    openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    # Configure and create a Supabase client instance
    supabase_url: str = os.environ.get("SUPABASE_URL")
    supabase_key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    supabase: Client = create_client(supabase_url, supabase_key)
    
    return openai_client, supabase

def generate_embedding(text: str, client: openai.OpenAI):
    """Generates an embedding for a given text using the OpenAI API."""
    # OpenAI recommends replacing newlines with a space for better performance.
    text = text.replace("\n", " ")
    response = client.embeddings.create(
        input=[text],
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def backfill():
    """
    Fetches all muse_items without an embedding, generates one, and updates the record.
    """
    print("Starting backfill process...")
    openai_client, supabase = setup_clients()

    try:
        response = supabase.from_("muse_items").select("id, content, description").is_("embedding", "NULL").execute()
        items_to_process = response.data
    except Exception as e:
        print(f"FATAL: Could not fetch items from the database. Error: {e}")
        return

    total_items = len(items_to_process)
    
    if total_items == 0:
        print("No items to process. All existing items appear to have embeddings.")
        return

    print(f"Found {total_items} items to process.")

    for index, item in enumerate(items_to_process):
        item_id = item['id']
        text_to_embed = f"Content: {item.get('content', '') or ''}\n\nDescription: {item.get('description', '') or ''}"
        
        print(f"Processing item {index + 1}/{total_items} (ID: {item_id})...", end="")
        
        try:
            # Generate the embedding vector using our new helper function
            embedding = generate_embedding(text_to_embed, openai_client)
            
            # Update the specific item in the database
            supabase.from_("muse_items").update({"embedding": embedding}).eq("id", item_id).execute()
            print(" -> Done")
            
            # A small delay to respect API rate limits and prevent overwhelming the service
            time.sleep(0.05) 

        except Exception as e:
            print(f" -> An unexpected error occurred: {e}")

    print("\nBackfill process completed!")

if __name__ == "__main__":
    backfill()