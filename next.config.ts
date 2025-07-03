// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The 'quality' key has been removed from here
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zbbavwjsaundnvxdfrdw.supabase.co',
        port: '',
        pathname: '/storage/v1/object/sign/muse-files/**',
      },
    ],
  },
};

export default nextConfig;