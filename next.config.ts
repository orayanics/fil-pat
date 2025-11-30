import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Unsplash images used by assessment templates
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      // Pinboard images used by seeded template items
      { protocol: 'https', hostname: 'i.pinimg.com', pathname: '/**' },
      // Fallback placeholder images
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      // Allow local dev images if any are referenced
      { protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/**' },
    ],
  },
};

export default nextConfig;
