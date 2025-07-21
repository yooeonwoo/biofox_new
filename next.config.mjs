/** @type {import('next').NextConfig} */
const nextConfig = {
  // Base settings
  poweredByHeader: false,
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.1.15:3003", "localhost:3003", "*.local"],

  // WebSocket and HMR settings
  experimental: {
    // Enable WebSocket fallback
    webpackBuildWorker: false,
  },

  // Development server configuration
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // WebSocket configuration for development
      config.infrastructureLogging = {
        level: 'error',
      };
      
      // Disable cache for WebSocket issues
      config.cache = false;
    }
    
    return config;
  },

  // Image Optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Build optimizations
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Security Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig; 