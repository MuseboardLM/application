// supabase/functions/generate-embedding/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { OpenAI } from "https://esm.sh/openai@4.51.0";

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { record } = await req.json();

    // 1. Generate the text to embed from the new item's data
    // This should be consistent with your backfill script for best results
    const textToEmbed = `Content: ${record.content || ""}\n\nDescription: ${
      record.description || ""
    }`;

    // 2. Call OpenAI to generate the embedding
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: textToEmbed.replace(/\n/g, " "),
    });

    const embedding = embeddingResponse.data[0].embedding;

    // 3. Update the original record in the database with the new embedding
    const { error } = await supabaseClient
      .from("muse_items")
      .update({ embedding: embedding, ai_status: 'completed' }) // Also update the AI status
      .eq("id", record.id);

    if (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true, id: record.id }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-embedding function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});