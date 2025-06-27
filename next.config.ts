// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add this 'images' configuration block
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zbbavwjsaundnvxdfrdw.supabase.co', // Your unique Supabase project hostname
        port: '',
        // Updated pathname for private, signed URLs from Supabase Storage
        pathname: '/storage/v1/object/sign/muse-files/**',
      },
    ],
  },
  // ... any other configurations you might have ...
};

export default nextConfig;