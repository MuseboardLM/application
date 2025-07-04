// supabase/functions/get-image-dimensions/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// ✨ NEW: Using a more robust, Deno-native library to get dimensions
import { Image } from 'https://deno.land/x/imagescript@1.2.17/mod.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { key } = await req.json();
    if (!key) throw new Error("Missing 'key' in request body.");

    // 1. Download the image from storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('muse-files')
      .download(key);

    if (downloadError) throw downloadError;

    const buffer = new Uint8Array(await fileData.arrayBuffer());

    // 2. ✨ NEW: Get image dimensions using ImageScript
    const image = await Image.decode(buffer);
    const { width, height } = image;

    if (!width || !height) {
      throw new Error(`Could not determine dimensions for image: ${key}`);
    }

    // 3. Update the corresponding row in the muse_items table
    const { error: updateError } = await supabaseAdmin
      .from('muse_items')
      .update({ image_width: width, image_height: height })
      .eq('content', key);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, width, height }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});