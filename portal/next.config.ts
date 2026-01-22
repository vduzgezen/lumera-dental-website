import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Increase body size limit for middleware buffering (Fixes 10MB limit error)
    middlewareClientMaxBodySize: '500mb', 
    
    // Increase limit for Server Actions (just in case)
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
};

export default nextConfig;