// supabase/functions/get-image-dimensions/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { imageSize } from 'https://esm.sh/image-size@1.1.1';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { key } = await req.json();
    if (!key) {
      throw new Error("Missing 'key' in request body. The key is the path to the image.");
    }

    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('muse-files')
      .download(key);

    if (downloadError) throw downloadError;

    const buffer = new Uint8Array(await fileData.arrayBuffer());
    const dimensions = imageSize(buffer);
    const { width, height } = dimensions;

    if (!width || !height) {
      throw new Error(`Could not determine dimensions for image: ${key}`);
    }

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
