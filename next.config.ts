import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // Use remotePatterns instead of the deprecated `images.domains`
    remotePatterns: [
      { protocol: 'https', hostname: 'i.pinimg.com', pathname: '/**' },
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      // Allow localhost (dev) images
      { protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/**' }
    ]
  },
  // Allow dev origins (for cross-origin requests to /_next/* when accessing via LAN IP)
  // Add any clinician device IPs used for testing, including the port.
  experimental: {
    // allowedDevOrigins is not yet typed in this workspace's Next types; ignore the TS check
  // @ts-expect-error - allowedDevOrigins may not exist in these Next types in this workspace
    allowedDevOrigins: [
      'http://192.168.254.188:3000',
      // You can add other local IPs here as needed, e.g. 'http://192.168.1.10:3000'
    ],
  },
};

export default nextConfig;
